import logging
import yfinance as yf
from langchain_core.tools import tool

logger = logging.getLogger(__name__)


@tool
def get_current_stock_price(ticker: str) -> str:
    """
    FALLBACK TOOL: Fetches the latest closing price for a given stock or crypto ticker via Yahoo Finance.
    Use when:
        - The user requests a specific price.
        - Accurate price data is required for calculations, valuation, or analysis.
    Avoid using for news, sentiment, research, or broad market analysis unless price data is explicitly needed.
    """
    try:
        stock = yf.Ticker(ticker)
        # Fetch data for the last 1 day
        hist = stock.history(period="1d")
        if hist.empty:
            return f"Could not fetch data for ticker {ticker}."

        # Get the closing price
        close_price = hist["Close"].iloc[-1]

        return f"The current/latest closing price for {ticker} is {close_price:.2f}"
    except Exception as e:
        logger.error(f"Failed to fetch stock price for {ticker}: {e}")
        return f"Failed to fetch stock price for {ticker}: {str(e)}"
