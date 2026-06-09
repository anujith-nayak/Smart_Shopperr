from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class ShoppingSession(Base):
    __tablename__ = "shopping_sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    budget = Column(Float, nullable=False)
    actual_spent = Column(Float, default=0.0)
    savings = Column(Float, default=0.0)
    status = Column(String, default="planned")  # planned, active, completed
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("SessionItem", back_populates="session", cascade="all, delete-orphan")


class SessionItem(Base):
    __tablename__ = "session_items"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("shopping_sessions.id"))
    name = Column(String, index=True)
    planned_quantity = Column(Float, default=1.0)
    planned_unit = Column(String, default="unit")  # g, kg, ml, L, unit, pack
    category = Column(String, default="Other")  # Snacks, Groceries, Personal Care, Dairy, Beverages, Household, Other
    is_purchased = Column(Boolean, default=False)
    planned_price = Column(Float, nullable=True)  # Estimated budget for this item
    actual_price = Column(Float, default=0.0)
    is_unplanned = Column(Boolean, default=False)

    session = relationship("ShoppingSession", back_populates="items")
    options = relationship("ProductOption", back_populates="item", cascade="all, delete-orphan")


class ProductOption(Base):
    __tablename__ = "product_options"

    id = Column(Integer, primary_key=True, index=True)
    session_item_id = Column(Integer, ForeignKey("session_items.id"))
    name = Column(String)  # Option details, e.g. "Pack of 2", "Family Pack"
    brand = Column(String)
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)  # g, kg, ml, L, unit, pack
    offer_type = Column(String, default="normal")  # normal, bogo, combo, discount
    discount_pct = Column(Float, default=0.0)  # Percentage discount if offer_type == "discount"
    
    # Calculated fields populated by AI engine or CRUD
    effective_price_per_unit = Column(Float, default=0.0)
    ranking = Column(Integer, default=1)
    label = Column(String, default="Normal")  # Best Deal, Smart Buy, Overpriced, Normal
    reason = Column(String, default="")

    item = relationship("SessionItem", back_populates="options")


class ComboPack(Base):
    __tablename__ = "combo_packs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float, nullable=False)
    description = Column(String, default="")
    is_active = Column(Boolean, default=True)

    items = relationship("ComboItem", back_populates="combo", cascade="all, delete-orphan")


class ComboItem(Base):
    __tablename__ = "combo_items"

    id = Column(Integer, primary_key=True, index=True)
    combo_id = Column(Integer, ForeignKey("combo_packs.id"))
    name = Column(String)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)

    combo = relationship("ComboPack", back_populates="items")
