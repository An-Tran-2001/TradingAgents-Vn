import asyncio
import logging
from typing import List, Union, Dict
import httpx
from bs4 import BeautifulSoup
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

async def fetch_and_extract(url: str, client: httpx.AsyncClient, max_chars: int = 4000) -> Dict[str, str]:
    """Fetches a URL and extracts its main text content cleanly."""
    try:
        response = await client.get(url, timeout=15.0, follow_redirects=True)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script, style, and other non-content elements
        for element in soup(["script", "style", "noscript", "header", "footer", "nav", "aside", "meta"]):
            element.decompose()
            
        # Extract text with space separator to avoid word merging
        text = soup.get_text(separator=' ', strip=True)
        
        # Clean up whitespace (remove multiple spaces/newlines)
        import re
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Truncate to avoid context window explosion (AI Engineering best practice)
        if len(text) > max_chars:
            text = text[:max_chars] + "... [TRUNCATED]"
            
        title = soup.title.string if soup.title else url
        
        return {
            "url": url,
            "title": str(title).strip(),
            "content": text,
            "error": None
        }
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error scraping {url}: {e.response.status_code}")
        return {"url": url, "title": "Error", "content": "", "error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error(f"Error scraping {url}: {str(e)}")
        return {"url": url, "title": "Error", "content": "", "error": str(e)}


@tool
async def scrape_links(urls: Union[str, List[str]]) -> str:
    """
    Scrapes the text content from one or multiple URLs concurrently.
    Use this to read articles, documentations, or specific web pages.
    
    Args:
        urls: A single URL string or a list of URL strings to scrape.
        
    Returns:
        A formatted string containing the title and extracted text from the websites.
    """
    if isinstance(urls, str):
        urls = [urls]
        
    if not urls:
        return "No URLs provided."
        
    # Limit to max 5 concurrent URLs to prevent abuse/overloading the context
    urls = urls[:5]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 TradingAgents/1.0"
    }
    
    # Concurrent fetching
    async with httpx.AsyncClient(headers=headers, verify=False) as client:
        tasks = [fetch_and_extract(url, client) for url in urls]
        results = await asyncio.gather(*tasks)
        
    # Format output for the agent
    output = []
    for res in results:
        if res["error"]:
            output.append(f"Source: {res['url']}\nError: {res['error']}\n---")
        else:
            output.append(f"Source: {res['url']}\nTitle: {res['title']}\nContent: {res['content']}\n---")
            
    return "\n".join(output)
