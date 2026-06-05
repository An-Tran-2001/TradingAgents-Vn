import sys
from langchain_core.tools import tool
from typing import Annotated, Literal
from tradingagents.dataflows.vn_vendor import (
    get_tcbs_stock_data,
    get_hose_announcements,
    get_major_shareholders,
    get_sector_data,
    get_market_breadth,
    get_vn_realtime_trading_data,
)
from langchain_core.runnables import RunnableConfig
from tradingagents.dataflows.vn_vendor import stream_vietnam_macro_data
import asyncio
import uuid
import json
from tradingagents.dataflows.vn_vendor import (
    calculate_technical_indicators_logic,
    detect_candlestick_pattern_logic,
    screen_stocks_logic,
    get_quick_valuation_logic,
    check_macro_correlation_logic,
)


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

    # Install a custom exception handler BEFORE running.
    # httpx creates background cleanup tasks (AsyncClient.aclose()) that fire
    # after the main coroutine completes. These tasks call loop.call_soon()
    # to schedule SSL transport teardown — which raises RuntimeError if the
    # loop is already closed. Because these tasks can complete (with the error)
    # BEFORE asyncio.all_tasks() drains them, we must suppress at the source
    # via the loop's exception handler, not by draining pending tasks.
    def _suppress_loop_closed(loop: asyncio.AbstractEventLoop, context: dict) -> None:
        exc = context.get("exception")
        if isinstance(exc, RuntimeError) and "Event loop is closed" in str(exc):
            return  # Expected during httpx/anyio cleanup — safe to ignore
        loop.default_exception_handler(context)

    new_loop.set_exception_handler(_suppress_loop_closed)
    asyncio.set_event_loop(new_loop)
    try:
        return new_loop.run_until_complete(_run())
    finally:
        # Proper asyncio shutdown: cancel all pending background tasks (like httpx 
        # cleanup) and run them to completion so their CancelledError is retrieved.
        # This prevents the noisy "Task exception was never retrieved" logs 
        # during garbage collection.
        try:
            pending = asyncio.all_tasks(new_loop)
            for task in pending:
                task.cancel()
            if pending:
                new_loop.run_until_complete(
                    asyncio.gather(*pending, return_exceptions=True)
                )
        except Exception:
            pass
        finally:
            new_loop.close()


@tool
def get_vn_market_news(
    symbol: Annotated[str, "Ticker symbol of the company."],
    target_date: Annotated[str, "Target date or year for the news (e.g., '2024-05-01')"] = None,
    config: RunnableConfig = None,
) -> str:
    """
    Retrieve domestic market news from top financial sources (CafeF, BaoMoi) via Browser Agent.
    Args:
        symbol (str): Ticker symbol of the company.
        target_date (str): Target date context.
    Returns:
        str: Formatted news report.
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
                    "tool": "get_vn_market_news",
                    "args": {"symbol": symbol, "target_date": target_date},
                    "browser_id": browser_id,
                },
            )

        try:
            from tradingagents.dataflows.vn_vendor import stream_market_news
            async for event in stream_market_news(
                symbol, target_date, config, browser_id=browser_id
            ):
                if event["type"] == "final_result":
                    final_res = event["content"]
                elif queue and main_loop:
                    main_loop.call_soon_threadsafe(queue.put_nowait, event)
        except Exception as e:
            final_res = f"Lỗi trong quá trình lấy tin tức: {str(e)}"
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
                        "tool": "get_vn_market_news",
                        "result": "Success",
                        "browser_id": browser_id,
                    },
                )

        return final_res

    if sys.platform == "win32":
        new_loop = asyncio.ProactorEventLoop()
    else:
        new_loop = asyncio.new_event_loop()

    # Install a custom exception handler BEFORE running.
    # httpx creates background cleanup tasks (AsyncClient.aclose()) that fire
    # after the main coroutine completes. These tasks call loop.call_soon()
    # to schedule SSL transport teardown — which raises RuntimeError if the
    # loop is already closed. Because these tasks can complete (with the error)
    # BEFORE asyncio.all_tasks() drains them, we must suppress at the source
    # via the loop's exception handler, not by draining pending tasks.
    def _suppress_loop_closed(loop: asyncio.AbstractEventLoop, context: dict) -> None:
        exc = context.get("exception")
        if isinstance(exc, RuntimeError) and "Event loop is closed" in str(exc):
            return  # Expected during httpx/anyio cleanup — safe to ignore
        loop.default_exception_handler(context)

    new_loop.set_exception_handler(_suppress_loop_closed)
    asyncio.set_event_loop(new_loop)
    try:
        return new_loop.run_until_complete(_run())
    finally:
        # Proper asyncio shutdown: cancel all pending background tasks (like httpx 
        # cleanup) and run them to completion so their CancelledError is retrieved.
        # This prevents the noisy "Task exception was never retrieved" logs 
        # during garbage collection.
        try:
            pending = asyncio.all_tasks(new_loop)
            for task in pending:
                task.cancel()
            if pending:
                new_loop.run_until_complete(
                    asyncio.gather(*pending, return_exceptions=True)
                )
        except Exception:
            pass
        finally:
            new_loop.close()


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
def get_vn_etf_flow(
    config: RunnableConfig = None,
) -> str:
    """
    Retrieve current ETF flows for the Vietnam Market (Fubon ETF, Diamond ETF, VN30 ETF) via Browser Agent.
    Returns:
        str: ETF flow report.
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
                    "tool": "get_vn_etf_flow",
                    "args": {},
                    "browser_id": browser_id,
                },
            )

        try:
            from tradingagents.dataflows.vn_vendor import stream_etf_flow
            async for event in stream_etf_flow(config=config, browser_id=browser_id):
                if event["type"] == "final_result":
                    final_res = event["content"]
                elif queue and main_loop:
                    main_loop.call_soon_threadsafe(queue.put_nowait, event)
        except Exception as e:
            final_res = f"Lỗi trong quá trình lấy dòng tiền ETF: {str(e)}"
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
                        "tool": "get_vn_etf_flow",
                        "result": "Success",
                        "browser_id": browser_id,
                    },
                )

        return final_res

    if sys.platform == "win32":
        new_loop = asyncio.ProactorEventLoop()
    else:
        new_loop = asyncio.new_event_loop()

    # Install a custom exception handler BEFORE running.
    # httpx creates background cleanup tasks (AsyncClient.aclose()) that fire
    # after the main coroutine completes. These tasks call loop.call_soon()
    # to schedule SSL transport teardown — which raises RuntimeError if the
    # loop is already closed. Because these tasks can complete (with the error)
    # BEFORE asyncio.all_tasks() drains them, we must suppress at the source
    # via the loop's exception handler, not by draining pending tasks.
    def _suppress_loop_closed(loop: asyncio.AbstractEventLoop, context: dict) -> None:
        exc = context.get("exception")
        if isinstance(exc, RuntimeError) and "Event loop is closed" in str(exc):
            return  # Expected during httpx/anyio cleanup — safe to ignore
        loop.default_exception_handler(context)

    new_loop.set_exception_handler(_suppress_loop_closed)
    asyncio.set_event_loop(new_loop)
    try:
        return new_loop.run_until_complete(_run())
    finally:
        # Proper asyncio shutdown: cancel all pending background tasks (like httpx 
        # cleanup) and run them to completion so their CancelledError is retrieved.
        # This prevents the noisy "Task exception was never retrieved" logs 
        # during garbage collection.
        try:
            pending = asyncio.all_tasks(new_loop)
            for task in pending:
                task.cancel()
            if pending:
                new_loop.run_until_complete(
                    asyncio.gather(*pending, return_exceptions=True)
                )
        except Exception:
            pass
        finally:
            new_loop.close()


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
def get_vn_market_breadth(
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
) -> str:
    """
    Retrieve Vietnam market trend / VNINDEX historical data for a given date range.
    Args:
        start_date (str): Start date.
        end_date (str): End date.
    Returns:
        str: Historical VNINDEX data.
    """
    return get_market_breadth(start_date, end_date)


@tool
def get_vn_social_sentiment(
    symbol: Annotated[str, "Ticker symbol of the company."],
    config: RunnableConfig = None,
) -> str:
    """
    Retrieve retail and social sentiment from local communities (FireAnt, Facebook, Forums).
    Args:
        symbol (str): Ticker symbol of the company.
    Returns:
        str: Sentiment analysis report.
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
                    "tool": "get_vn_social_sentiment",
                    "args": {"symbol": symbol},
                    "browser_id": browser_id,
                },
            )

        try:
            from tradingagents.dataflows.vn_vendor import stream_social_sentiment
            async for event in stream_social_sentiment(
                symbol, config, browser_id=browser_id
            ):
                if event["type"] == "final_result":
                    final_res = event["content"]
                elif queue and main_loop:
                    main_loop.call_soon_threadsafe(queue.put_nowait, event)
        except Exception as e:
            final_res = f"Lỗi trong quá trình lấy tâm lý xã hội: {str(e)}"
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
                        "tool": "get_vn_social_sentiment",
                        "result": "Success",
                        "browser_id": browser_id,
                    },
                )

        return final_res

    if sys.platform == "win32":
        new_loop = asyncio.ProactorEventLoop()
    else:
        new_loop = asyncio.new_event_loop()

    # Install a custom exception handler BEFORE running.
    # httpx creates background cleanup tasks (AsyncClient.aclose()) that fire
    # after the main coroutine completes. These tasks call loop.call_soon()
    # to schedule SSL transport teardown — which raises RuntimeError if the
    # loop is already closed. Because these tasks can complete (with the error)
    # BEFORE asyncio.all_tasks() drains them, we must suppress at the source
    # via the loop's exception handler, not by draining pending tasks.
    def _suppress_loop_closed(loop: asyncio.AbstractEventLoop, context: dict) -> None:
        exc = context.get("exception")
        if isinstance(exc, RuntimeError) and "Event loop is closed" in str(exc):
            return  # Expected during httpx/anyio cleanup — safe to ignore
        loop.default_exception_handler(context)

    new_loop.set_exception_handler(_suppress_loop_closed)
    asyncio.set_event_loop(new_loop)
    try:
        return new_loop.run_until_complete(_run())
    finally:
        # Proper asyncio shutdown: cancel all pending background tasks (like httpx 
        # cleanup) and run them to completion so their CancelledError is retrieved.
        # This prevents the noisy "Task exception was never retrieved" logs 
        # during garbage collection.
        try:
            pending = asyncio.all_tasks(new_loop)
            for task in pending:
                task.cancel()
            if pending:
                new_loop.run_until_complete(
                    asyncio.gather(*pending, return_exceptions=True)
                )
        except Exception:
            pass
        finally:
            new_loop.close()


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

@tool
def render_stock_chart(
    ticker: Annotated[str, "Ticker symbol to chart"],
    timeframe: Annotated[str, "Timeframe, e.g., '1D', '1W'"],
    indicators: Annotated[list, "List of indicators to overlay, e.g., ['SMA20', 'RSI']"] = [],
) -> str:
    """
    Renders an interactive stock chart with optional technical indicators directly in the chat UI.
    You MUST output the exact markdown block returned by this tool in your final response to the user.
    """
    data = {
        "type": "stock_chart",
        "ticker": ticker,
        "timeframe": timeframe,
        "indicators": indicators
    }
    return f"```widget\n{json.dumps(data)}\n```"

@tool
def render_financial_chart(
    ticker: Annotated[str, "Ticker symbol"],
    metric: Annotated[str, "Financial metric to plot, e.g., 'revenue', 'profit', 'pe'"],
    period: Annotated[str, "Period, e.g., '5Y', '10Q'"] = "5Y",
) -> str:
    """
    Renders a financial bar/line chart for a specific metric over a period.
    You MUST output the exact markdown block returned by this tool in your final response to the user.
    """
    data = {
        "type": "financial_chart",
        "ticker": ticker,
        "metric": metric,
        "period": period
    }
    return f"```widget\n{json.dumps(data)}\n```"

@tool
def render_flow_chart(
    ticker: Annotated[str, "Ticker symbol"],
    days: Annotated[int, "Number of days to plot, e.g., 30"] = 30,
) -> str:
    """
    Renders a chart showing institutional and foreign net buying/selling flow over the last N days.
    You MUST output the exact markdown block returned by this tool in your final response to the user.
    """
    data = {
        "type": "flow_chart",
        "ticker": ticker,
        "days": days
    }
    return f"```widget\n{json.dumps(data)}\n```"

@tool
def calculate_technical_indicators(
    ticker: Annotated[str, "Ticker symbol"],
    indicators: Annotated[list, "List of indicators, e.g., ['RSI', 'MACD', 'EMA20']"] = ["RSI", "MACD"],
) -> str:
    """
    Quickly calculate and interpret common technical indicators for a given stock.
    Use the result to answer the user's questions about technical signals.
    """
    return calculate_technical_indicators_logic(ticker, indicators)

@tool
def detect_candlestick_pattern(
    ticker: Annotated[str, "Ticker symbol"],
    timeframe: Annotated[str, "Timeframe, e.g., '1D', '1W'"] = "1D",
) -> str:
    """
    Quickly detect the latest candlestick pattern for a stock.
    Use the result to inform the user about potential trend reversals or continuation.
    """
    return detect_candlestick_pattern_logic(ticker, timeframe)

@tool
def screen_stocks(
    conditions: Annotated[dict, "Dictionary of screening conditions, e.g., {'sector': 'Ngân hàng', 'pe_max': 10}"],
) -> str:
    """
    Screen stocks across the Vietnam market based on specific fundamental or technical conditions.
    Summarize the list of matching stocks for the user.
    """
    return screen_stocks_logic(conditions)

@tool
def get_quick_valuation(
    ticker: Annotated[str, "Ticker symbol"],
) -> str:
    """
    Provide a quick relative valuation (P/E, P/B) comparison against the industry average.
    Use this to give the user a rapid assessment of whether the stock is cheap or expensive.
    """
    return get_quick_valuation_logic(ticker)

@tool
def check_macro_correlation(
    ticker: Annotated[str, "Ticker symbol"],
    macro_variable: Annotated[str, "Macro variable, e.g., 'USD/VND', 'interest_rate'"],
) -> str:
    """
    Check the historical correlation between a stock and a macroeconomic variable.
    """
    return check_macro_correlation_logic(ticker, macro_variable)
