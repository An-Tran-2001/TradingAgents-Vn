from langchain_core.tools import tool


@tool
def run_financial_research(ticker: str, analysis_date: str) -> str:
    """
    Triggers a comprehensive multi-agent financial research pipeline (TradingAgents) for a NEW analysis of a specific asset.

    CRITICAL USAGE RULES:
    1. ONLY use this tool when the user EXPLICITLY requests a NEW deep analysis, stock evaluation, or investment advice (buy/hold/sell) for a specific ticker that has NOT been analyzed in the current context yet.
    2. DO NOT use this tool if the user is asking follow-up questions, asking for clarification, or requesting a simpler explanation of an ALREADY GENERATED report. For those cases, use the `query_past_report` tool or rely on your existing context.
    3. DO NOT use this tool for simple general questions, fetching current stock prices, or reading general market news.

    The pipeline involves specialized agents (Fundamental, Sentiment, News, Technical Analysts, Risk Management) and takes significant time and resources to generate a comprehensive investment decision (Action, Reasoning, Position Sizing).

    Use cases:
    - User: "Phân tích mã AAPL ngày hôm nay" -> Call run_financial_research(ticker="AAPL", analysis_date="YYYY-MM-DD")
    - User: "Có nên mua VCB lúc này không?" -> Call run_financial_research(ticker="VCB", analysis_date="YYYY-MM-DD")

    Requires `ticker` (the exact stock symbol) and `analysis_date` (YYYY-MM-DD format).
    """
    # This tool acts as a routing signal in the Orchestrator.
    # The actual execution is handled by the ResearchAgentRunner via FastAPI handoff.
    return "HANDOFF_TO_RESEARCH"
