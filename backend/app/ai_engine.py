import re
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

def normalize_unit_and_qty(qty: float, unit: str) -> Tuple[float, str]:
    """
    Normalizes volume/weight quantities to base units (g, ml, unit) 
    for uniform price-per-unit comparisons.
    """
    u = unit.lower().strip()
    # Normalize grams/kilograms
    if u in ["kg", "kilogram", "kilograms"]:
        return qty * 1000.0, "g"
    elif u in ["g", "gram", "grams", "gm"]:
        return qty, "g"
    
    # Normalize liters/milliliters
    elif u in ["l", "liter", "liters"]:
        return qty * 1000.0, "ml"
    elif u in ["ml", "milliliter", "milliliters", "ml."]:
        return qty, "ml"
    
    # Packs, units, pcs
    elif u in ["pack", "packs", "pc", "pcs", "piece", "pieces", "unit", "units"]:
        return qty, "unit"
    
    return qty, unit

def calculate_effective_price(price: float, qty: float, unit: str, offer_type: str, discount_pct: float = 0.0) -> Tuple[float, float, str]:
    """
    Calculates the actual money spent and the effective price per normalized unit.
    Returns: (effective_price, normalized_qty, normalized_unit)
    """
    norm_qty, norm_unit = normalize_unit_and_qty(qty, unit)
    
    if norm_qty <= 0:
        return 999999.0, qty, unit
        
    actual_cost = price
    effective_qty = norm_qty
    
    offer = offer_type.lower().strip()
    if offer == "bogo" or offer == "buy 1 get 1":
        # Pay price of 1, get 2x quantity
        effective_qty = norm_qty * 2.0
    elif offer == "discount" and discount_pct > 0:
        actual_cost = price * (1.0 - (discount_pct / 100.0))
    elif offer == "combo":
        # Combo cost is analyzed as single unit group
        pass
        
    unit_price = actual_cost / effective_qty
    return unit_price, norm_qty, norm_unit

def rank_and_evaluate_options(options: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Takes list of option dicts, calculates unit prices, ranks them,
    and returns them with intelligent labels and justification reasons.
    """
    if not options:
        return []
        
    processed_options = []
    for opt in options:
        price = float(opt.get("price", 0.0))
        qty = float(opt.get("quantity", 1.0))
        unit = str(opt.get("unit", "unit"))
        offer_type = str(opt.get("offer_type", "normal"))
        discount_pct = float(opt.get("discount_pct", 0.0))
        
        eff_price, norm_qty, norm_unit = calculate_effective_price(
            price, qty, unit, offer_type, discount_pct
        )
        
        processed_options.append({
            **opt,
            "effective_price_per_unit": eff_price,
            "normalized_qty": norm_qty,
            "normalized_unit": norm_unit
        })
        
    # Sort by effective price (cheapest per unit first)
    processed_options.sort(key=lambda x: x["effective_price_per_unit"])
    
    best_unit_price = processed_options[0]["effective_price_per_unit"]
    
    for idx, opt in enumerate(processed_options):
        rank = idx + 1
        opt["ranking"] = rank
        
        # Determine labels based on price delta percentage
        unit_price = opt["effective_price_per_unit"]
        
        if rank == 1:
            opt["label"] = "Best Deal"
            savings_pct = 0.0
            if len(processed_options) > 1:
                next_price = processed_options[1]["effective_price_per_unit"]
                # Calculate saving compared to next best option
                savings_pct = ((next_price - best_unit_price) / next_price) * 100
                opt["reason"] = f"Lowest unit price at ₹{best_unit_price:.4f}/{opt['normalized_unit']}. Saves {savings_pct:.1f}% compared to alternate deals."
            else:
                opt["reason"] = f"Top choice. Effective unit price is ₹{best_unit_price:.4f}/{opt['normalized_unit']}."
        else:
            price_delta = ((unit_price - best_unit_price) / best_unit_price) * 100
            
            if price_delta <= 15.0:
                opt["label"] = "Smart Buy"
                opt["reason"] = f"Only {price_delta:.1f}% more expensive than the best option. Solid value."
            elif price_delta >= 40.0:
                opt["label"] = "Overpriced"
                opt["reason"] = f"⚠️ Misleading price trick! Costs {price_delta:.1f}% more per unit than the Best Deal."
            else:
                opt["label"] = "Normal"
                opt["reason"] = f"Standard choice. {price_delta:.1f}% higher unit price than the lead offer."
                
    return processed_options

def optimize_combo_comparison(combo_price: float, combo_items: List[Dict[str, Any]], separate_options: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Compares buying a combo pack vs buying comparable items separately.
    `separate_options` is a dictionary maps item name to its list of individual brand options.
    """
    total_individual_cost = 0.0
    breakdown = []
    
    for item in combo_items:
        name = item["name"]
        qty = item["quantity"]
        unit = item["unit"]
        
        norm_qty, norm_unit = normalize_unit_and_qty(qty, unit)
        
        # Find the best unit price for this item class from options
        options = separate_options.get(name, [])
        if options:
            ranked = rank_and_evaluate_options(options)
            best_opt = ranked[0]
            unit_price = best_opt["effective_price_per_unit"]
            equivalent_cost = unit_price * norm_qty
            brand_used = best_opt["brand"]
        else:
            # Fallback estimation if no separate options are added
            unit_price = 1.5  # estimate
            equivalent_cost = unit_price * norm_qty
            brand_used = "Generic Brand"
            
        total_individual_cost += equivalent_cost
        breakdown.append({
            "name": name,
            "combo_qty": f"{qty} {unit}",
            "best_separate_brand": brand_used,
            "equivalent_separate_cost": round(equivalent_cost, 2)
        })
        
    savings = total_individual_cost - combo_price
    recommend_combo = combo_price < total_individual_cost
    
    recommendation_text = ""
    if recommend_combo:
        recommendation_text = f"Choose the Combo Pack! You save ₹{savings:.2f} compared to buying individual items separately."
    else:
        recommendation_text = f"Buy separate items instead! The combo pack is actually ₹{abs(savings):.2f} MORE expensive than selecting best-value individual items."
        
    return {
        "combo_price": combo_price,
        "total_individual_cost": round(total_individual_cost, 2),
        "savings": round(savings, 2),
        "recommend_combo": recommend_combo,
        "recommendation": recommendation_text,
        "breakdown": breakdown
    }

def get_contextual_ai_advice(page: str, data: Optional[Dict[str, Any]] = None) -> AIChatResponse:
    """
    Simulates high-fidelity context-aware AI comments and replies based on active page actions.
    """
    reply = ""
    suggestions = []
    
    if page == "landing":
        reply = "Welcome to Smart Shopper! I'm your AI Shopping Copilot. I scan retail packaging sizes, run comparisons, analyze combo values, and flag misleading discounts (like larger bottles costing more per gram!). Create a session to get started."
        suggestions = ["How does price ranking work?", "Analyze a sample BOGO deal"]
        
    elif page == "dashboard":
        budget_acc = data.get("budget_accuracy", 100) if data else 82
        savings = data.get("total_savings", 0) if data else 430
        
        reply = f"Hello! Your current shopping profile shows a solid Budget Accuracy score of {budget_acc}%. You've saved around ₹{savings} this month using optimized brand comparisons. I noticed you tend to spend slightly more on weekends — let's try to plan our grocery runs more tightly."
        suggestions = ["Optimize a new shopping list", "Review my savings trends", "Where did I overspend?"]
        
    elif page == "planner":
        reply = "When adding items, try to estimate a planned budget. This helps me track your target versus actual spending and calculate your impulse buying index later. Don't forget to specify quantities!"
        suggestions = ["Suggest a list for weekly groceries", "How to set realistic budgets?"]
        
    elif page == "comparison":
        reply = "Ready to audit some prices! Input product brand names, prices, and volumes (e.g. 500g, 1L, or BOGO deals). I'll calculate the true price per unit to ensure you choose the best option. I also have a Combo Optimizer to split-test bundles."
        suggestions = ["Run a BOGO check", "Test a Combo Pack value", "Why is the larger size often a trick?"]
        
    elif page == "monitor":
        items = data.get("items", []) if data else []
        unplanned = [i for i in items if i.get("is_unplanned")]
        over_budget = False
        
        if data:
            spent = data.get("actual_spent", 0)
            budget = data.get("budget", 0)
            if spent > budget:
                over_budget = True
                
        if over_budget:
            reply = f"⚠️ Alert: You have exceeded the session budget of ₹{data.get('budget')}! You are currently at ₹{data.get('actual_spent')}. I recommend removing some impulse buys to balance it out."
        elif unplanned:
            reply = f"I see you added {len(unplanned)} unplanned items (impulse purchases) totaling ₹{sum(i.get('actual_price',0) for i in unplanned):.2f}. Keep an eye on these to protect your target savings!"
        else:
            reply = "You're shopping right on track! Check off items as you place them in your cart, enter their actual purchase price, and I'll keep your budgets updated live."
            
        suggestions = ["Show budget summary", "Am I in the safe spending zone?"]
        
    elif page == "analytics":
        reply = "Here is your spending and behavior autopsy. It looks like 'Snacks & Beverages' is your highest impulse category, making up 42% of unplanned buys. Combo deals and BOGOs have saved you ₹430 this month."
        suggestions = ["How can I reduce impulse purchases?", "Download monthly report"]
        
    elif page == "history":
        reply = "Here lie your past wins. You can review your historic budget accuracy, compare your plan vs actual spending, and look back at individual session logs. Let's see how much we saved over time!"
        suggestions = ["Compare this month vs last month", "Show most expensive session"]
        
    else:
        reply = "I'm here to help you shop smarter. Let me know if you want to run a quick price audit or estimate a combo pack value."
        suggestions = ["Compare products", "Create new list"]
        
    # Return formatted response
    return {"reply": reply, "suggestions": suggestions}

def handle_user_query(query: str, page: str, session_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Responds to specific user inputs in the AI chat widget.
    """
    q = query.lower().strip()
    
    # Check for unit price calculations in text
    # Pattern: 500g for 120 or 1kg for 250
    match_calc = re.findall(r'(\d+(?:\.\d+)?)\s*(g|kg|ml|l|L|unit|pack|pcs)\s+(?:for|costs|is)\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)', q)
    if len(match_calc) >= 2:
        opts = []
        for i, (qty_s, unit, price_s) in enumerate(match_calc):
            qty = float(qty_s)
            price = float(price_s)
            opts.append({
                "name": f"Option {i+1}",
                "brand": f"Brand {i+1}",
                "price": price,
                "quantity": qty,
                "unit": unit,
                "offer_type": "normal"
            })
        ranked = rank_and_evaluate_options(opts)
        reply = "I've calculated the unit prices for you:\n\n"
        for r in ranked:
            reply += f"* **{r['name']}** ({r['quantity']}{r['unit']}): Effective unit price is **₹{r['effective_price_per_unit']:.4f}/{r['normalized_unit']}** ({r['label']})\n"
        reply += f"\n👉 **Recommendation:** {ranked[0]['name']} is the best deal! "
        if len(ranked) > 1:
            diff = ((ranked[1]['effective_price_per_unit'] - ranked[0]['effective_price_per_unit']) / ranked[1]['effective_price_per_unit']) * 100
            reply += f"It saves you **{diff:.1f}%** compared to the alternative."
        return {
            "reply": reply,
            "suggestions": ["Run another comparison", "Add this item to my plan"]
        }
        
    if "bogo" in q or "buy 1 get 1" in q:
        return {
            "reply": "A BOGO (Buy One Get One Free) deal effectively doubles your product volume for the same price. For instance, a 500g bottle for ₹200 with BOGO gives you 1000g for ₹200 (unit price ₹0.20/g). Always compare this against larger bulk packs, which sometimes still manage to be cheaper or more expensive per unit!",
            "suggestions": ["Compare 250g BOGO vs 500g Normal", "How to optimize combos"]
        }
    elif "impulse" in q or "control spending" in q:
        return {
            "reply": "To control impulse spending: \n1. **Stick to the plan:** Set budgets beforehand in the Planner page.\n2. **Check the alert monitor:** The Live Monitor will warn you when your unplanned items cross a certain threshold.\n3. **Pause before buying:** Ask yourself, 'Is this a planned need, or a temporary craving?'",
            "suggestions": ["Review my impulse statistics", "Set impulse alert thresholds"]
        }
    elif "combo" in q:
        return {
            "reply": "Combo packs bundle different items (e.g. shampoo, bodywash, facewash) for a single price. Retailers often claim they are cheaper, but sometimes buying the individual components (especially if you choose the 'Best Deal' brands) is cheaper! Use our **Combo Optimizer** tool in the comparison tab to check.",
            "suggestions": ["Try Combo Optimizer", "What is my biggest combo saving?"]
        }
    elif "budget" in q:
        return {
            "reply": "Your overall budget accuracy is 82%. Staying within budget depends on estimating prices realistically. When planning, check past history for items to see average prices you paid, and stick to the suggested 'Best Deal' options in the Comparison page.",
            "suggestions": ["Change budget thresholds", "Review history"]
        }
    
    # Generic responses
    return {
        "reply": "I'm scanning your active shopping session details. Ask me anything about deals, price comparisons, combo optimization, or how to reduce snacks/impulse spending!",
        "suggestions": ["Explain BOGO math", "Analyze a combo pack", "Show impulse spending tips"]
    }
