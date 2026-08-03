import json

# Ізольований файл зі скілами (інструментами). 
# За спекою з Upwork, сюди не повинні мати доступ автосгенеровані агенти без перевірки.

def get_dashboard_metrics() -> str:
    """
    Simulates querying the local database or CSV to get today's metrics.
    In production, this connects to PostgreSQL or parses dataset.csv.
    """
    # Мокаємо дані, які ми бачили в handoff.md проєкту Unicorn
    data = {
        "total_leads": 5323,
        "sold": 4305,
        "returned": 558,
        "pending": 460,
        "total_spend_usd": 130621.22,
        "total_revenue_usd": 158257.00,
        "net_profit_usd": 27635.45,
        "roi_percent": 21.2,
        "fill_rate_percent": 80.9,
        "return_rate_percent": 10.5
    }
    return json.dumps(data)

def get_buyer_status(buyer_name: str) -> str:
    """
    Gets specific metrics for a buyer (e.g. BuyerC).
    """
    if buyer_name.lower() == "buyerc":
        return json.dumps({
            "buyer": "BuyerC",
            "leads": 443,
            "roi_percent": 87.2,
            "net_profit_usd": 9541,
            "status": "active"
        })
    return json.dumps({"error": "Buyer not found"})

# Опис інструментів для LLM (Anthropic tool schema)
TOOLS_SCHEMA = [
    {
        "name": "get_dashboard_metrics",
        "description": "Retrieves the current overall financial and lead metrics for the Unicorn dashboard.",
        "input_schema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "get_buyer_status",
        "description": "Retrieves metrics and status for a specific buyer.",
        "input_schema": {
            "type": "object",
            "properties": {
                "buyer_name": {
                    "type": "string",
                    "description": "The name of the buyer (e.g. BuyerC)"
                }
            },
            "required": ["buyer_name"]
        }
    }
]
