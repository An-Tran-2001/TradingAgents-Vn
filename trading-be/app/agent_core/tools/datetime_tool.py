from datetime import datetime, timezone
from langchain_core.tools import tool

@tool
def get_current_datetime() -> str:
    """
    Retrieves the current UTC date and time.
    Use cases:
    - "Analyze AAPL" -> First call get_current_datetime() to infer today's date, then call run_financial_research.
    - "What is today's date?" -> get_current_datetime()
    """
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%dT%H:%M:%SZ")
