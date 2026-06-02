from datetime import datetime, timezone
from langchain_core.tools import tool

@tool
def get_current_datetime() -> str:
    """
    Use this tool to get the current UTC date and time in ISO 8601 format.
    It is useful for inferring the current analysis_date when the user does not specify one.
    """
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%dT%H:%M:%SZ")
