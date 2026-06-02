from langchain_core.tools import tool

@tool
def run_financial_research(ticker: str, analysis_date: str) -> str:
    """
    Use this tool when the user asks for a deep financial analysis, research, or report on a specific ticker (e.g. AAPL, BTC-USD).
    You MUST provide both ticker and analysis_date (YYYY-MM-DD).
    """
    # This tool acts as a routing signal in the Orchestrator.
    # The actual execution is handled by the ResearchAgentRunner via FastAPI handoff.
    return "HANDOFF_TO_RESEARCH"
