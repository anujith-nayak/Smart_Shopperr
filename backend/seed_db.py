import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal, engine, Base
from app import models
from datetime import datetime, timedelta

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    # Check if sessions already exist
    if db.query(models.ShoppingSession).count() > 0:
        print("Database already seeded.")
        sys.exit(0)

    # Seed historical completed sessions
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
    db.refresh(s1)
    
    items1 = [
        models.SessionItem(session_id=s1.id, name="Atta (Wheat Flour)", planned_quantity=5.0, planned_unit="kg", category="Groceries", is_purchased=True, planned_price=250.0, actual_price=230.0, is_unplanned=False),
        models.SessionItem(session_id=s1.id, name="Rice (Basmati)", planned_quantity=2.0, planned_unit="kg", category="Groceries", is_purchased=True, planned_price=200.0, actual_price=190.0, is_unplanned=False),
        models.SessionItem(session_id=s1.id, name="Sunflower Oil", planned_quantity=2.0, planned_unit="L", category="Groceries", is_purchased=True, planned_price=350.0, actual_price=320.0, is_unplanned=False),
        models.SessionItem(session_id=s1.id, name="Potato Chips", planned_quantity=3.0, planned_unit="pack", category="Snacks", is_purchased=True, planned_price=90.0, actual_price=90.0, is_unplanned=False),
        models.SessionItem(session_id=s1.id, name="Chocolate Cookie", planned_quantity=2.0, planned_unit="pack", category="Snacks", is_purchased=True, planned_price=60.0, actual_price=80.0, is_unplanned=True),
        models.SessionItem(session_id=s1.id, name="Dishwashing Gel", planned_quantity=1.0, planned_unit="L", category="Household", is_purchased=True, planned_price=200.0, actual_price=180.0, is_unplanned=False),
        models.SessionItem(session_id=s1.id, name="Coca Cola", planned_quantity=2.0, planned_unit="L", category="Beverages", is_purchased=True, planned_price=100.0, actual_price=110.0, is_unplanned=True)
    ]
    db.add_all(items1)
    db.commit()

    # Seed brand options for Atta
    db_atta = db.query(models.SessionItem).filter(models.SessionItem.session_id == s1.id, models.SessionItem.name == "Atta (Wheat Flour)").first()
    if db_atta:
        opt1 = models.ProductOption(
            session_item_id=db_atta.id, name="Aashirvaad 5kg", brand="Aashirvaad", price=250.0, quantity=5.0, unit="kg", offer_type="normal",
            effective_price_per_unit=50.0, ranking=1, label="Best Deal", reason="Lowest unit price at ₹50.00/kg."
        )
        opt2 = models.ProductOption(
            session_item_id=db_atta.id, name="Fortune 5kg", brand="Fortune", price=270.0, quantity=5.0, unit="kg", offer_type="normal",
            effective_price_per_unit=54.0, ranking=2, label="Normal", reason="8% more expensive than best deal."
        )
        db.add_all([opt1, opt2])
        db.commit()

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
    db.refresh(s2)
    
    items2 = [
        models.SessionItem(session_id=s2.id, name="Shampoo", planned_quantity=1.0, planned_unit="unit", category="Personal Care", is_purchased=True, planned_price=200.0, actual_price=180.0, is_unplanned=False),
        models.SessionItem(session_id=s2.id, name="Toothpaste", planned_quantity=2.0, planned_unit="unit", category="Personal Care", is_purchased=True, planned_price=150.0, actual_price=120.0, is_unplanned=False),
        models.SessionItem(session_id=s2.id, name="Amul Butter", planned_quantity=500.0, planned_unit="g", category="Dairy", is_purchased=True, planned_price=250.0, actual_price=250.0, is_unplanned=False),
        models.SessionItem(session_id=s2.id, name="Fresh Milk", planned_quantity=4.0, planned_unit="L", category="Dairy", is_purchased=True, planned_price=200.0, actual_price=200.0, is_unplanned=False),
        models.SessionItem(session_id=s2.id, name="Body Wash", planned_quantity=1.0, planned_unit="unit", category="Personal Care", is_purchased=True, planned_price=200.0, actual_price=200.0, is_unplanned=True)
    ]
    db.add_all(items2)
    db.commit()
    
    print("Database successfully seeded with demo history.")
finally:
    db.close()
