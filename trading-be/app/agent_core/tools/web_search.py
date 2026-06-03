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


def _fetch_google_search_results(query: str, api_key: str) -> str:
    """Fetch search results using Gemini's native Google Search grounding."""
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        tool = types.Tool(google_search=types.GoogleSearch())

        response = client.models.generate_content(
            model="gemini-2.5-flash",
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


@tool
def search_web(
    query: str,
    max_results: Optional[int] = 5,
    source: Optional[str] = "duckduckgo",
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

    # Try Google Native Search if API key is present
    google_api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get(
        "GOOGLE_API_KEY"
    )
    if google_api_key:
        try:
            return _fetch_google_search_results(query, google_api_key)
        except Exception as e:
            # Fall back to DuckDuckGo if Google search fails
            pass

    if max_results is None:
        max_results = 5

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
