from langchain_core.tools import tool
from typing import Annotated
from tradingagents.dataflows.interface import route_to_vendor
from tradingagents.dataflows.vn_vendor import (
    get_tcbs_stock_data,
    get_vietnam_macro_data,
    get_cafef_news,
    get_hose_announcements,
    get_major_shareholders,
    get_etf_flow,
    get_sector_data,
    get_market_breadth,
    get_social_sentiment,
    get_vn_realtime_trading_data
)

@tool
def get_vietnam_macro(
    indicator: Annotated[str, "Tên chỉ số vĩ mô (cpi, gdp, interest_rate, exchange_rate)"],
    curr_date: Annotated[str, "Ngày hiện tại yyyy-mm-dd"] = None
) -> str:
    """
    Retrieve Vietnam macroeconomic data (CPI, GDP, Interest Rate, Exchange Rate, etc.)
    Uses sources like SBV, GSO, or WiGroup.
    Args:
        indicator (str): The macroeconomic indicator to fetch.
        curr_date (str): Current trading date in yyyy-mm-dd format.
    Returns:
        str: Formatted macro data report.
    """
    return get_vietnam_macro_data(indicator, curr_date)

@tool
def get_vn_market_news(
    symbol: Annotated[str, "Mã chứng khoán (Ticker symbol)"],
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
    symbol: Annotated[str, "Mã chứng khoán (Ticker symbol)"],
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
    symbol: Annotated[str, "Mã chứng khoán (Ticker symbol)"],
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
    symbol: Annotated[str, "Mã chứng khoán (Ticker symbol)"],
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
    symbol: Annotated[str, "Mã chứng khoán (Ticker symbol)"],
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
    symbol: Annotated[str, "Mã chứng khoán (Ticker symbol)"],
) -> str:
    """
    Retrieve real-time trading stats, foreign ownership limits, ceiling/floor prices from CafeF.
    Args:
        symbol (str): Ticker symbol of the company.
    Returns:
        str: Real-time trading data report.
    """
    return get_vn_realtime_trading_data(symbol)

