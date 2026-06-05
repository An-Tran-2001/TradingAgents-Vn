import sys
from langchain_core.tools import tool
from typing import Annotated, Literal
from tradingagents.dataflows.vn_vendor import (
    get_tcbs_stock_data,
    get_cafef_news,
    get_hose_announcements,
    get_major_shareholders,
    get_etf_flow,
    get_sector_data,
    get_market_breadth,
    get_social_sentiment,
    get_vn_realtime_trading_data,
)
from langchain_core.runnables import RunnableConfig
from tradingagents.dataflows.vn_vendor import stream_vietnam_macro_data
import asyncio
import uuid


@tool
def get_vietnam_macro(
    indicator: Annotated[
        Literal["cpi", "gdp", "interest_rate", "exchange_rate", "fdi", "pmi"],
        "Short code of macroeconomic indicator (cpi, gdp, interest_rate, exchange_rate, fdi, pmi).",
    ],
    target_date: Annotated[
        str, "Target date or year for the data (e.g., '2024', '2024-05-01')"
    ] = None,
    config: RunnableConfig = None,
) -> str:
    """
    Retrieve Vietnam macroeconomic data via an autonomous Browser Agent.

    Args:
        indicator (str): Macroeconomic indicator short code (cpi, gdp, interest_rate, exchange_rate, fdi, pmi).
        target_date (str): Target date/year for the data (e.g., '2024', '2024-05-01').
    Returns:
        str: Formatted macro report with exact numbers and source URLs.
    """

    async def _run():
        final_res = "No data"
        browser_id = str(uuid.uuid4())[:8]
        queue = config.get("configurable", {}).get("stream_queue") if config else None
        main_loop = config.get("configurable", {}).get("loop") if config else None

        if queue and main_loop:
            main_loop.call_soon_threadsafe(
                queue.put_nowait,
                {
                    "type": "orchestrator_tool_start",
                    "tool": "get_vietnam_macro",
                    "args": {"indicator": indicator, "target_date": target_date},
                    "browser_id": browser_id,
                },
            )

        try:
            async for event in stream_vietnam_macro_data(
                indicator, target_date, config, browser_id=browser_id
            ):
                if event["type"] == "final_result":
                    final_res = event["content"]
                elif queue and main_loop:
                    main_loop.call_soon_threadsafe(queue.put_nowait, event)
        except Exception as e:
            final_res = f"Lỗi trong quá trình lấy dữ liệu vĩ mô: {str(e)}"
            if queue and main_loop:
                main_loop.call_soon_threadsafe(
                    queue.put_nowait,
                    {
                        "type": "agent_log",
                        "step": 0,
                        "agent": "System",
                        "log_type": "Tool",
                        "content": final_res,
                        "time": "now",
                    },
                )
        finally:
            if queue and main_loop:
                main_loop.call_soon_threadsafe(
                    queue.put_nowait,
                    {
                        "type": "orchestrator_tool_end",
                        "tool": "get_vietnam_macro",
                        "result": "Success",
                        "browser_id": browser_id,
                    },
                )

        return final_res

    # CRITICAL: Always create a NEW event loop for each invocation.
    # LangGraph's ToolNode runs parallel tool calls in separate threads.
    # If two threads share the same event loop via asyncio.get_event_loop(),
    # concurrent run_until_complete() calls will crash silently, causing
    # only the first tool call to succeed.
    if sys.platform == "win32":
        new_loop = asyncio.ProactorEventLoop()
    else:
        new_loop = asyncio.new_event_loop()

    asyncio.set_event_loop(new_loop)
    try:
        return new_loop.run_until_complete(_run())
    finally:
        new_loop.close()


@tool
def get_vn_market_news(
    symbol: Annotated[str, "Ticker symbol of the company."],
) -> str:
    """
    Retrieve domestic market news from top financial sources in Vietnam like CafeF, Vietstock.
    Args:
        symbol (str): Ticker symbol of the company.
    Returns:
        str: Formatted news report.
    """
    return get_cafef_news(symbol)


@tool
def get_vn_official_announcements(
    symbol: Annotated[str, "Ticker symbol of the company."],
) -> str:
    """
    Retrieve official exchange announcements from HOSE/HNX for a given ticker,
    including insider trading, board resolutions, and ETF reviews.
    Args:
        symbol (str): Ticker symbol of the company.
    Returns:
        str: Formatted announcements report.
    """
    return get_hose_announcements(symbol)


@tool
def get_vn_major_shareholders(
    symbol: Annotated[str, "Ticker symbol of the company."],
) -> str:
    """
    Retrieve major shareholders data (Foreign Ownership, Dragon Capital, VinaCapital, etc.)
    Args:
        symbol (str): Ticker symbol of the company.
    Returns:
        str: Major shareholders report from FiinGroup.
    """
    return get_major_shareholders(symbol)


@tool
def get_vn_etf_flow() -> str:
    """
    Retrieve current ETF flows for the Vietnam Market (Fubon ETF, Diamond ETF, VN30 ETF).
    Returns:
        str: ETF flow report from HOSE/VSDC.
    """
    return get_etf_flow()


@tool
def get_vn_sector_data(
    symbol: Annotated[str, "Ticker symbol of the company."],
) -> str:
    """
    Retrieve sector-level data and peer comparison metrics (Top companies in the same sector).
    Args:
        symbol (str): The ticker symbol to get sector peers for.
    Returns:
        str: Sector data report from CafeF.
    """
    return get_sector_data(symbol)


@tool
def get_vn_market_breadth() -> str:
    """
    Retrieve Vietnam market breadth (Advancers, Decliners, New Highs, New Lows).
    Returns:
        str: Market breadth report from TCBS/WiFeed.
    """
    return get_market_breadth()


@tool
def get_vn_social_sentiment(
    symbol: Annotated[str, "Ticker symbol of the company."],
) -> str:
    """
    Retrieve retail and social sentiment from local communities (FireAnt, Facebook, Forums).
    Args:
        symbol (str): Ticker symbol of the company.
    Returns:
        str: Sentiment analysis report.
    """
    return get_social_sentiment(symbol)


@tool
def get_vn_realtime_trading_data_tool(
    symbol: Annotated[str, "Ticker symbol of the company."],
) -> str:
    """
    Retrieve real-time trading stats, foreign ownership limits, ceiling/floor prices from CafeF.
    Args:
        symbol (str): Ticker symbol of the company.
    Returns:
        str: Real-time trading data report.
    """
    return get_vn_realtime_trading_data(symbol)
