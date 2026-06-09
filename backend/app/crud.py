from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Dict, Any
from . import models, schemas
from .ai_engine import rank_and_evaluate_options, optimize_combo_comparison

# Sessions
def get_sessions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ShoppingSession).order_by(models.ShoppingSession.created_at.desc()).offset(skip).limit(limit).all()

def get_session(db: Session, session_id: int):
    return db.query(models.ShoppingSession).filter(models.ShoppingSession.id == session_id).first()

def create_session(db: Session, session: schemas.ShoppingSessionCreate):
    db_session = models.ShoppingSession(
        name=session.name,
        budget=session.budget,
        actual_spent=0.0,
        savings=0.0,
        status="planned"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def update_session(db: Session, session_id: int, session_update: schemas.ShoppingSessionUpdate):
    db_session = get_session(db, session_id)
    if not db_session:
        return None
        
    update_data = session_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_session, key, value)
        
    db.commit()
    db.refresh(db_session)
    return db_session

def delete_session(db: Session, session_id: int):
    db_session = get_session(db, session_id)
    if db_session:
        db.delete(db_session)
        db.commit()
        return True
    return False

# Session Items
def get_session_items(db: Session, session_id: int):
    return db.query(models.SessionItem).filter(models.SessionItem.session_id == session_id).all()

def get_session_item(db: Session, item_id: int):
    return db.query(models.SessionItem).filter(models.SessionItem.id == item_id).first()

def create_session_item(db: Session, item: schemas.SessionItemCreate, session_id: int):
    db_item = models.SessionItem(
        session_id=session_id,
        name=item.name,
        planned_quantity=item.planned_quantity,
        planned_unit=item.planned_unit,
        category=item.category,
        planned_price=item.planned_price,
        is_unplanned=item.is_unplanned,
        is_purchased=False,
        actual_price=0.0
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_session_item(db: Session, item_id: int, item_update: schemas.SessionItemUpdate):
    db_item = get_session_item(db, item_id)
    if not db_item:
        return None
        
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    
    # Recalculate parent session totals
    recalculate_session_totals(db, db_item.session_id)
    
    return db_item

def delete_session_item(db: Session, item_id: int):
    db_item = get_session_item(db, item_id)
    if db_item:
        session_id = db_item.session_id
        db.delete(db_item)
        db.commit()
        recalculate_session_totals(db, session_id)
        return True
    return False

# Product Options
def get_product_option(db: Session, option_id: int):
    return db.query(models.ProductOption).filter(models.ProductOption.id == option_id).first()

def get_product_options_by_item(db: Session, item_id: int):
    return db.query(models.ProductOption).filter(models.ProductOption.session_item_id == item_id).all()

def create_product_option(db: Session, option: schemas.ProductOptionCreate, item_id: int):
    # Add new option
    db_option = models.ProductOption(
        session_item_id=item_id,
        name=option.name,
        brand=option.brand,
        price=option.price,
        quantity=option.quantity,
        unit=option.unit,
        offer_type=option.offer_type,
        discount_pct=option.discount_pct,
        effective_price_per_unit=0.0,
        ranking=1,
        label="Normal",
        reason=""
    )
    db.add(db_option)
    db.commit()
    db.refresh(db_option)
    
    # Recalculate options rankings for this item
    recalculate_option_rankings(db, item_id)
    
    return get_product_option(db, db_option.id)

def delete_product_option(db: Session, option_id: int):
    db_option = get_product_option(db, option_id)
    if db_option:
        item_id = db_option.session_item_id
        db.delete(db_option)
        db.commit()
        recalculate_option_rankings(db, item_id)
        return True
    return False

def recalculate_option_rankings(db: Session, item_id: int):
    options = db.query(models.ProductOption).filter(models.ProductOption.session_item_id == item_id).all()
    if not options:
        return
        
    options_data = []
    for opt in options:
        options_data.append({
            "id": opt.id,
            "name": opt.name,
            "brand": opt.brand,
            "price": opt.price,
            "quantity": opt.quantity,
            "unit": opt.unit,
            "offer_type": opt.offer_type,
            "discount_pct": opt.discount_pct
        })
        
    ranked_options = rank_and_evaluate_options(options_data)
    
    # Save back to db
    for item in ranked_options:
        db_opt = db.query(models.ProductOption).filter(models.ProductOption.id == item["id"]).first()
        if db_opt:
            db_opt.effective_price_per_unit = item["effective_price_per_unit"]
            db_opt.ranking = item["ranking"]
            db_opt.label = item["label"]
            db_opt.reason = item["reason"]
            
    db.commit()

def recalculate_session_totals(db: Session, session_id: int):
    session = get_session(db, session_id)
    if not session:
        return
        
    items = db.query(models.SessionItem).filter(models.SessionItem.session_id == session_id).all()
    
    actual_spent = 0.0
    savings = 0.0
    
    for item in items:
        if item.is_purchased:
            actual_spent += item.actual_price
            
            # Estimate savings
            # Compare what was spent to what it would have cost using average/overpriced options, or budget
            options = db.query(models.ProductOption).filter(models.ProductOption.session_item_id == item.id).all()
            if options:
                ranked = sorted(options, key=lambda x: x.effective_price_per_unit)
                best_deal = ranked[0]
                
                # If they purchased the best deal option
                # Savings is the difference between the average price of other brands and this price, OR planned vs actual
                # For simplified math, savings = (average option price - actual price) * item count
                # Only calculate if they bought the best deal and other options exist
                if len(ranked) > 1:
                    avg_other_price = sum(o.price for o in ranked[1:]) / len(ranked[1:])
                    # Scale according to volume ratio
                    # Savings = avg_other_price - actual_price
                    item_savings = max(0.0, avg_other_price - item.actual_price)
                    savings += item_savings
                elif item.planned_price and item.actual_price < item.planned_price:
                    savings += (item.planned_price - item.actual_price)
            else:
                # Fallback: savings is planned budget - actual spending
                if item.planned_price and item.actual_price < item.planned_price:
                    savings += (item.planned_price - item.actual_price)
                    
    session.actual_spent = round(actual_spent, 2)
    session.savings = round(savings, 2)
    db.commit()

# Combo Packs
def get_combos(db: Session):
    return db.query(models.ComboPack).filter(models.ComboPack.is_active == True).all()

def create_combo_pack(db: Session, combo: schemas.ComboPackCreate):
    db_combo = models.ComboPack(
        name=combo.name,
        price=combo.price,
        description=combo.description,
        is_active=True
    )
    db.add(db_combo)
    db.commit()
    db.refresh(db_combo)
    
    for item in combo.items:
        db_item = models.ComboItem(
            combo_id=db_combo.id,
            name=item.name,
            quantity=item.quantity,
            unit=item.unit
        )
        db.add(db_item)
        
    db.commit()
    db.refresh(db_combo)
    return db_combo

# Dashboard Analytics
def get_dashboard_analytics(db: Session) -> Dict[str, Any]:
    sessions = db.query(models.ShoppingSession).filter(models.ShoppingSession.status == "completed").all()
    
    total_sessions = len(sessions)
    total_spent = sum(s.actual_spent for s in sessions)
    total_savings = sum(s.savings for s in sessions)
    
    # Budget Accuracy
    accuracy_matches = 0
    for s in sessions:
        if s.actual_spent <= s.budget:
            accuracy_matches += 1
    budget_accuracy = (accuracy_matches / total_sessions * 100) if total_sessions > 0 else 100.0
    
    # Category Breakdown
    cat_spend = db.query(
        models.SessionItem.category, 
        func.sum(models.SessionItem.actual_price)
    ).join(models.ShoppingSession).filter(
        models.ShoppingSession.status == "completed",
        models.SessionItem.is_purchased == True
    ).group_by(models.SessionItem.category).all()
    
    category_breakdown = []
    category_total = sum(spend for cat, spend in cat_spend) if cat_spend else 0
    for cat, spend in cat_spend:
        pct = (spend / category_total * 100) if category_total > 0 else 0
        category_breakdown.append({
            "category": cat,
            "amount": round(spend, 2),
            "percentage": round(pct, 1)
        })
        
    # Sort category breakdown by amount descending
    category_breakdown.sort(key=lambda x: x["amount"], reverse=True)
    
    # Savings Trends (Last 5 completed sessions)
    trend_sessions = db.query(models.ShoppingSession).filter(
        models.ShoppingSession.status == "completed"
    ).order_by(models.ShoppingSession.created_at.asc()).all()
    
    savings_trends = []
    for s in trend_sessions:
        date_str = s.created_at.strftime("%b %d")
        savings_trends.append({
            "date": date_str,
            "budget": s.budget,
            "actual": s.actual_spent,
            "savings": s.savings
        })
        
    # Impulse Buys
    impulse_items = db.query(models.SessionItem).join(models.ShoppingSession).filter(
        models.ShoppingSession.status == "completed",
        models.SessionItem.is_purchased == True,
        models.SessionItem.is_unplanned == True
    ).all()
    
    impulse_buy_count = len(impulse_items)
    impulse_buy_spent = sum(item.actual_price for item in impulse_items)
    
    # Generate insights messages based on database realities
    insights = []
    if total_sessions > 0:
        # Check high spending categories
        if category_breakdown:
            top_cat = category_breakdown[0]["category"]
            insights.append(f"You spend the most on **{top_cat}**, which accounts for {category_breakdown[0]['percentage']}% of total purchases.")
            
        # Check impulse buying ratio
        if impulse_buy_spent > 0:
            impulse_ratio = (impulse_buy_spent / total_spent * 100) if total_spent > 0 else 0
            insights.append(f"Impulse purchases represent **{impulse_ratio:.1f}%** of your total budget. Consider locking items beforehand.")
        else:
            insights.append("Great self-control! You have recorded 0% impulse spending in your completed sessions.")
            
        # Combo recommendations
        insights.append(f"Opting for recommended brand alternatives saved you a total of **₹{total_savings:.2f}** this month.")
        
        # Budget adherence advice
        if budget_accuracy < 70:
            insights.append("Your budget adherence is low ({:.1f}%). Try increasing your planning budgets by 10-15% to match store prices.".format(budget_accuracy))
        else:
            insights.append("Excellent shopping discipline! You stay within your target budget **{:.0f}%** of the time.".format(budget_accuracy))
    else:
        # Default starter insights
        insights = [
            "Welcome! Create your first shopping session to see budget tracking analytics.",
            "You stay within budget 100% of the time initially.",
            "Use the comparison engine to discover savings on household grocery goods."
        ]
        
    return {
        "total_sessions": total_sessions,
        "total_spent": round(total_spent, 2),
        "total_savings": round(total_savings, 2),
        "budget_accuracy": round(budget_accuracy, 1),
        "category_breakdown": category_breakdown,
        "savings_trends": savings_trends,
        "impulse_buy_count": impulse_buy_count,
        "impulse_buy_spent": round(impulse_buy_spent, 2),
        "insights": insights
    }
