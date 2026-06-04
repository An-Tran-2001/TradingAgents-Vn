from langchain_core.tools import tool


@tool
def run_financial_research(ticker: str, analysis_date: str) -> str:
    """
    Executes a heavy, multi-agent financial research pipeline to generate a NEW, comprehensive investment decision.

    STRICT CONDITIONS FOR CALLING THIS TOOL - YOU MUST VERIFY THESE BEFORE CALLING:
    Condition 1: The user explicitly requests a DEEP, COMPREHENSIVE analysis or a buy/hold/sell RECOMMENDATION for a specific ticker.
    Condition 2: The requested ticker HAS NOT been deeply analyzed in the current conversation history yet.

    DO NOT CALL THIS TOOL IF:
    - The user is asking a follow-up question about an already analyzed ticker (Use `query_past_report` instead).
    - The user only wants to know the current price, general news, or basic company info.
    - The user is asking a casual or theoretical finance question.

    WARNING: This tool is expensive and time-consuming. It simulates a full investment firm (Technical, Fundamental, Sentiment, Risk Analysts). Only trigger it when a full, new research report is definitively demanded.

    Examples that SHOULD trigger this tool:
    - "Phân tích mã AAPL giúp tôi."
    - "Tôi có nên mua cổ phiếu VCB ngay bây giờ không?" -> (Call with ticker='VCB.VN')
    - "Đánh giá toàn diện mã HPG." -> (Call with ticker='HPG.VN')

    IMPORTANT TICKER FORMATTING RULES:
    - For Vietnamese stocks (e.g., VCB, FPT, HPG, SSI, VND), you MUST append the `.VN` suffix to the ticker (e.g., `VCB.VN`, `FPT.VN`) because global financial APIs require it.
    - For US stocks (e.g., AAPL, TSLA), use the standard ticker without any suffix.

    Args:
        ticker (str): The exact stock/crypto symbol. (Remember to append .VN for Vietnam stocks!)
        analysis_date (str): The target date for analysis in 'YYYY-MM-DD' format.
    """
    # This tool acts as a routing signal in the Orchestrator.
    # The actual execution is handled by the ResearchAgentRunner via FastAPI handoff.
    return "HANDOFF_TO_RESEARCH"
