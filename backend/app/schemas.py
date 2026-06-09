from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime

# Product Options
class ProductOptionBase(BaseModel):
    name: str
    brand: str
    price: float
    quantity: float
    unit: str  # g, kg, ml, L, unit, pack
    offer_type: str = "normal"  # normal, bogo, combo, discount
    discount_pct: Optional[float] = 0.0

class ProductOptionCreate(ProductOptionBase):
    pass

class ProductOption(ProductOptionBase):
    id: int
    session_item_id: int
    effective_price_per_unit: float
    ranking: int
    label: str
    reason: str

    class Config:
        orm_mode = True

# Session Items
class SessionItemBase(BaseModel):
    name: str
    planned_quantity: float = 1.0
    planned_unit: str = "unit"
    category: str = "Other"
    planned_price: Optional[float] = None
    is_unplanned: bool = False

class SessionItemCreate(SessionItemBase):
    pass

class SessionItemUpdate(BaseModel):
    is_purchased: Optional[bool] = None
    actual_price: Optional[float] = None

class SessionItem(SessionItemBase):
    id: int
    session_id: int
    is_purchased: bool
    actual_price: float
    options: List[ProductOption] = []

    class Config:
        orm_mode = True

# Shopping Sessions
class ShoppingSessionBase(BaseModel):
    name: str
    budget: float

class ShoppingSessionCreate(ShoppingSessionBase):
    pass

class ShoppingSessionUpdate(BaseModel):
    status: Optional[str] = None
    actual_spent: Optional[float] = None
    savings: Optional[float] = None

class ShoppingSession(ShoppingSessionBase):
    id: int
    actual_spent: float
    savings: float
    status: str
    created_at: datetime
    items: List[SessionItem] = []

    class Config:
        orm_mode = True

# Combo Packs
class ComboItemBase(BaseModel):
    name: str
    quantity: float
    unit: str

class ComboItemCreate(ComboItemBase):
    pass

class ComboItem(ComboItemBase):
    id: int
    combo_id: int

    class Config:
        orm_mode = True

class ComboPackBase(BaseModel):
    name: str
    price: float
    description: Optional[str] = ""

class ComboPackCreate(ComboPackBase):
    items: List[ComboItemCreate]

class ComboPack(ComboPackBase):
    id: int
    is_active: bool
    items: List[ComboItem] = []

    class Config:
        orm_mode = True

# Analytics / Insights Response Schemas
class CategorySpend(BaseModel):
    category: str
    amount: float
    percentage: float

class SavingsTrend(BaseModel):
    date: str
    budget: float
    actual: float
    savings: float

class DashboardStats(BaseModel):
    total_sessions: int
    total_spent: float
    total_savings: float
    budget_accuracy: float  # Percentage of matches where actual <= budget
    category_breakdown: List[CategorySpend]
    savings_trends: List[SavingsTrend]
    impulse_buy_count: int
    impulse_buy_spent: float
    insights: List[str]

# AI Assistant Interaction Schemas
class ChatMessage(BaseModel):
    sender: str  # user or ai
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AIChatRequest(BaseModel):
    message: str
    current_page: str  # landing, dashboard, planner, comparison, monitor, analytics, history
    session_id: Optional[int] = None
    context_data: Optional[dict] = None

class AIChatResponse(BaseModel):
    reply: str
    suggestions: List[str]
