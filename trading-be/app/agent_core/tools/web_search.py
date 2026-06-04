import os
import urllib.request
from html.parser import HTMLParser
from typing import Optional
from langchain_core.tools import tool


class _DuckDuckGoParser(HTMLParser):
    def __init__(self, max_results: int = 5):
        super().__init__()
        self.max_results = max_results
        self.results = []
        self._inside_result_link = False
        self._current_href = None
        self._current_text = []

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        attr_map = {name: value for name, value in attrs}
        class_name = attr_map.get("class", "")
        if "result__a" in class_name.split():
            self._inside_result_link = True
            self._current_href = attr_map.get("href")
            self._current_text = []

    def handle_endtag(self, tag):
        if tag != "a" or not self._inside_result_link:
            return
        title = "".join(self._current_text).strip()
        if title and self._current_href:
            self.results.append((title, self._current_href))
        self._inside_result_link = False
        self._current_href = None
        self._current_text = []

    def handle_data(self, data):
        if self._inside_result_link:
            self._current_text.append(data)


def _fetch_duckduckgo_results(query: str, max_results: int) -> list[tuple[str, str]]:
    url = "https://html.duckduckgo.com/html/"
    data = urllib.request.urlopen(
        urllib.request.Request(
            url,
            data=urllib.parse.urlencode({"q": query, "kl": "us-en"}).encode("utf-8"),
            headers={
                "User-Agent": "TradingAgents/1.0 (+https://github.com/TauricResearch/TradingAgents)"
            },
            method="POST",
        ),
        timeout=10,
    )
    html = data.read().decode("utf-8", errors="ignore")
    parser = _DuckDuckGoParser(max_results=max_results)
    parser.feed(html)
    return parser.results[:max_results]

class _GoogleScrapeParser(HTMLParser):
    def __init__(self, max_results: int = 5):
        super().__init__()
        self.max_results = max_results
        self.results = []
        self._current_href = None
        self._inside_h3 = False
        self._current_title = []

    def handle_starttag(self, tag, attrs):
        attr_map = {name: value for name, value in attrs}
        if tag == "a":
            href = attr_map.get("href", "")
            if href.startswith("/url?q="):
                import urllib.parse
                parsed = urllib.parse.urlparse(href)
                self._current_href = urllib.parse.parse_qs(parsed.query).get("q", [""])[0]
            elif href.startswith("http") and "google.com" not in href:
                self._current_href = href
        elif tag == "h3":
            self._inside_h3 = True
            self._current_title = []

    def handle_endtag(self, tag):
        if tag == "h3" and self._inside_h3:
            self._inside_h3 = False
            title = "".join(self._current_title).strip()
            if title and self._current_href:
                # Avoid duplicates
                if not any(r[1] == self._current_href for r in self.results):
                    self.results.append((title, self._current_href))
        elif tag == "a":
            pass

    def handle_data(self, data):
        if self._inside_h3:
            self._current_title.append(data)


def _fetch_google_html_results(query: str, max_results: int) -> list[tuple[str, str]]:
    url = "https://www.google.com/search?q=" + urllib.parse.quote(query)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }
    )
    data = urllib.request.urlopen(req, timeout=10)
    html = data.read().decode("utf-8", errors="ignore")
    
    parser = _GoogleScrapeParser(max_results=max_results)
    parser.feed(html)
    return parser.results[:max_results]


def _fetch_google_search_results(query: str, api_key: str, model: str) -> str:
    """Fetch search results using Gemini's native Google Search grounding."""
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        tool = types.Tool(google_search=types.GoogleSearch())

        response = client.models.generate_content(
            model=model or "gemini-2.5-flash",
            contents=f"Search the web for: {query}. Provide a concise but comprehensive summary of the results.",
            config=types.GenerateContentConfig(tools=[tool], temperature=0.2),
        )

        output = [response.text]

        # Try to append sources if grounding metadata is available
        if hasattr(response, "candidates") and response.candidates:
            candidate = response.candidates[0]
            if (
                hasattr(candidate, "grounding_metadata")
                and candidate.grounding_metadata
            ):
                metadata = candidate.grounding_metadata
                if hasattr(metadata, "grounding_chunks"):
                    output.append("\nSources:")
                    for chunk in metadata.grounding_chunks:
                        if hasattr(chunk, "web") and chunk.web:
                            title = getattr(chunk.web, "title", "Unknown Title")
                            uri = getattr(chunk.web, "uri", "Unknown URI")
                            output.append(f"- {title} ({uri})")

        return "\n".join(output)
    except Exception as e:
        raise Exception(f"Google Search failed: {e}")


from langchain_core.runnables import RunnableConfig

@tool
def search_web(
    query: str,
    max_results: Optional[int] = 5,
    source: Optional[str] = "duckduckgo",
    config: RunnableConfig = None,
) -> str:
    """
    Perform a web search and return the top results.

    Args:
        query: Search query.
        max_results: Maximum number of results to return.
        source: Search source. Only "duckduckgo" is supported by default.

    Returns:
        A formatted list of search results.
    """
    if not query or not query.strip():
        return "No query provided."

    # Extract context injected by the orchestrator/runner
    configurable = config.get("configurable", {}) if config else {}
    provider = configurable.get("provider", "")
    model = configurable.get("model", "gemini-2.5-flash")
    api_key = configurable.get("api_key") or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    # Try Google Native Search ONLY if provider is Google
    if provider.lower() == "google" and api_key:
        try:
            return _fetch_google_search_results(query, api_key, model)
        except Exception as e:
            # Fall back to DuckDuckGo if Google search fails
            pass

    if max_results is None:
        max_results = 5

    # Try scraping Google HTML directly as first fallback
    try:
        results = _fetch_google_html_results(query, max_results=max_results)
        if results:
            formatted = [f"{idx + 1}. {title} — {url}" for idx, (title, url) in enumerate(results)]
            return "\n".join(formatted)
    except Exception as e:
        # Fall back to DuckDuckGo if HTML scraping fails
        pass

    source_key = str(source or "duckduckgo").strip().lower()
    if source_key != "duckduckgo":
        return (
            f"Unsupported search source '{source}'. "
            "Currently only 'duckduckgo' is supported."
        )

    try:
        results = _fetch_duckduckgo_results(query, max_results=max_results)
    except Exception as exc:
        return f"Search failed: {exc}"

    if not results:
        return "No results found."

    formatted = [
        f"{idx + 1}. {title} — {url}" for idx, (title, url) in enumerate(results)
    ]
    return "\n".join(formatted)
