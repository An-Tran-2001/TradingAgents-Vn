import logging
import yfinance as yf
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

@tool
def get_current_stock_price(ticker: str) -> str:
    """
    Use this tool to get the current or most recent closing stock price for a given ticker (e.g., AAPL, TSLA, BTC-USD).
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
