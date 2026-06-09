from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import os

from .database import engine, Base, get_db
from . import models, schemas, crud, ai_engine

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Shopper API", description="AI-powered shopping companion backend")

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Shopper API server. Operational."}

# ==========================================
# SHOPPING SESSIONS ENDPOINTS
# ==========================================

@app.get("/api/sessions", response_model=List[schemas.ShoppingSession])
def read_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_sessions(db, skip=skip, limit=limit)

@app.get("/api/sessions/{session_id}", response_model=schemas.ShoppingSession)
def read_session(session_id: int, db: Session = Depends(get_db)):
    db_session = crud.get_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session

@app.post("/api/sessions", response_model=schemas.ShoppingSession)
def create_session(session: schemas.ShoppingSessionCreate, db: Session = Depends(get_db)):
    return crud.create_session(db, session)

@app.put("/api/sessions/{session_id}", response_model=schemas.ShoppingSession)
def update_session(session_id: int, session_update: schemas.ShoppingSessionUpdate, db: Session = Depends(get_db)):
    db_session = crud.update_session(db, session_id, session_update)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    success = crud.delete_session(db, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}

# ==========================================
# SESSION ITEMS ENDPOINTS
# ==========================================

@app.post("/api/sessions/{session_id}/items", response_model=schemas.SessionItem)
def create_item(session_id: int, item: schemas.SessionItemCreate, db: Session = Depends(get_db)):
    db_session = crud.get_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return crud.create_session_item(db, item, session_id)

@app.put("/api/items/{item_id}", response_model=schemas.SessionItem)
def update_item(item_id: int, item_update: schemas.SessionItemUpdate, db: Session = Depends(get_db)):
    db_item = crud.update_session_item(db, item_id, item_update)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@app.delete("/api/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    success = crud.delete_session_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

# ==========================================
# PRODUCT OPTIONS COMPARISON ENDPOINTS
# ==========================================

@app.post("/api/items/{item_id}/options", response_model=schemas.ProductOption)
def create_option(item_id: int, option: schemas.ProductOptionCreate, db: Session = Depends(get_db)):
    db_item = crud.get_session_item(db, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Session item not found")
    return crud.create_product_option(db, option, item_id)

@app.delete("/api/options/{option_id}")
def delete_option(option_id: int, db: Session = Depends(get_db)):
    success = crud.delete_product_option(db, option_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product option not found")
    return {"message": "Option deleted successfully"}

# ==========================================
# COMBO OPTIMIZER ENDPOINTS
# ==========================================

@app.post("/api/combos/optimize")
def optimize_combo(payload: Dict[str, Any]):
    """
    Payload structure:
    {
      "combo_price": 650.0,
      "combo_items": [
        {"name": "Shampoo", "quantity": 200, "unit": "ml"},
        {"name": "Bodywash", "quantity": 150, "unit": "ml"},
        {"name": "Facewash", "quantity": 100, "unit": "ml"}
      ],
      "separate_options": {
        "Shampoo": [
          {"brand": "Dove", "price": 180, "quantity": 200, "unit": "ml", "offer_type": "normal"},
          {"brand": "Pantene", "price": 200, "quantity": 200, "unit": "ml", "offer_type": "bogo"}
        ],
        "Bodywash": [
          {"brand": "Nivea", "price": 220, "quantity": 250, "unit": "ml", "offer_type": "normal"}
        ],
        "Facewash": [
          {"brand": "Himalaya", "price": 150, "quantity": 100, "unit": "ml", "offer_type": "normal"}
        ]
      }
    }
    """
    combo_price = float(payload.get("combo_price", 0.0))
    combo_items = payload.get("combo_items", [])
    separate_options = payload.get("separate_options", {})
    
    return ai_engine.optimize_combo_comparison(combo_price, combo_items, separate_options)

# ==========================================
# ANALYTICS ENDPOINTS
# ==========================================

@app.get("/api/analytics/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_analytics(db)

# ==========================================
# AI CHAT ASSISTANT ENDPOINTS
# ==========================================

@app.post("/api/ai/chat", response_model=schemas.AIChatResponse)
def chat_with_assistant(request: schemas.AIChatRequest, db: Session = Depends(get_db)):
    message = request.message
    page = request.current_page
    session_id = request.session_id
    
    # Extract session context data if session_id is active
    context_data = None
    if session_id:
        db_session = crud.get_session(db, session_id)
        if db_session:
            # Map session to simple dict context
            context_data = {
                "budget": db_session.budget,
                "actual_spent": db_session.actual_spent,
                "savings": db_session.savings,
                "items": [
                    {
                        "name": item.name,
                        "category": item.category,
                        "is_purchased": item.is_purchased,
                        "actual_price": item.actual_price,
                        "is_unplanned": item.is_unplanned
                    } for item in db_session.items
                ]
            }
            
    # Check if context init
    if message == "__context_init__":
        return ai_engine.get_contextual_ai_advice(page, context_data)
    else:
        # Standard chat reply
        return ai_engine.handle_user_query(message, page, context_data)

# Create a demo session script for testing if db is empty
@app.post("/api/dev/seed")
def seed_database(db: Session = Depends(get_db)):
    # Check if sessions exist
    sessions = db.query(models.ShoppingSession).all()
    if len(sessions) > 0:
        return {"message": "Database already has data. Seed skipped."}
        
    # Seed standard combo pacs/history
    # Let's seed 3 historical completed sessions for rich dashboard view
    s1 = models.ShoppingSession(
        name="Weekly Groceries - D-Mart",
        budget=1500.0,
        actual_spent=1340.0,
        savings=180.0,
        status="completed",
        created_at=datetime.utcnow() - timedelta(days=12)
    )
    db.add(s1)
    db.commit()
    
    # Items for s1
    items1 = [
        models.SessionItem(session_id=s1.id, name="Atta (Wheat Flour)", planned_quantity=5.0, planned_unit="kg", category="Groceries", is_purchased=True, planned_price=250.0, actual_price=230.0, is_unplanned=False),
        models.SessionItem(session_id=s1.id, name="Rice (Basmati)", planned_quantity=2.0, planned_unit="kg", category="Groceries", is_purchased=True, planned_price=200.0, actual_price=190.0, is_unplanned=False),
        models.SessionItem(session_id=s1.id, name="Sunflower Oil", planned_quantity=2.0, planned_unit="L", category="Groceries", is_purchased=True, planned_price=350.0, actual_price=320.0, is_unplanned=False),
        models.SessionItem(session_id=s1.id, name="Potato Chips", planned_quantity=3.0, planned_unit="pack", category="Snacks", is_purchased=True, planned_price=90.0, actual_price=90.0, is_unplanned=False),
        models.SessionItem(session_id=s1.id, name="Chocolate Cookie", planned_quantity=2.0, planned_unit="pack", category="Snacks", is_purchased=True, planned_price=60.0, actual_price=80.0, is_unplanned=True), # impulse
        models.SessionItem(session_id=s1.id, name="Dishwashing Gel", planned_quantity=1.0, planned_unit="L", category="Household", is_purchased=True, planned_price=200.0, actual_price=180.0, is_unplanned=False),
        models.SessionItem(session_id=s1.id, name="Coca Cola", planned_quantity=2.0, planned_unit="L", category="Beverages", is_purchased=True, planned_price=100.0, actual_price=110.0, is_unplanned=True) # impulse
    ]
    db.add_all(items1)
    
    s2 = models.ShoppingSession(
        name="Personal Hygiene & Dairy",
        budget=1000.0,
        actual_spent=950.0,
        savings=150.0,
        status="completed",
        created_at=datetime.utcnow() - timedelta(days=6)
    )
    db.add(s2)
    db.commit()
    
    items2 = [
        models.SessionItem(session_id=s2.id, name="Shampoo", planned_quantity=1.0, planned_unit="ml", category="Personal Care", is_purchased=True, planned_price=200.0, actual_price=180.0, is_unplanned=False),
        models.SessionItem(session_id=s2.id, name="Toothpaste", planned_quantity=2.0, planned_unit="unit", category="Personal Care", is_purchased=True, planned_price=150.0, actual_price=120.0, is_unplanned=False),
        models.SessionItem(session_id=s2.id, name="Amul Butter", planned_quantity=500.0, planned_unit="g", category="Dairy", is_purchased=True, planned_price=250.0, actual_price=250.0, is_unplanned=False),
        models.SessionItem(session_id=s2.id, name="Fresh Milk", planned_quantity=4.0, planned_unit="L", category="Dairy", is_purchased=True, planned_price=200.0, actual_price=200.0, is_unplanned=False),
        models.SessionItem(session_id=s2.id, name="Body Wash", planned_quantity=1.0, planned_unit="ml", category="Personal Care", is_purchased=True, planned_price=200.0, actual_price=200.0, is_unplanned=True) # impulse
    ]
    db.add_all(items2)
    
    db.commit()
    return {"message": "Database seeded with 2 completed sessions and 12 items."}
