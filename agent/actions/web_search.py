import requests

def web_search(query: str) -> str:
    """Perform web search using DuckDuckGo instant answer / search API or fallback."""
    try:
        url = f"https://api.duckduckgo.com/?q={query}&format=json&no_html=1"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            abstract = data.get("AbstractText")
            if abstract:
                return f"Search Result for '{query}': {abstract}"
            related = data.get("RelatedTopics", [])
            if related:
                for r in related:
                    if "Text" in r:
                        return f"Search Result for '{query}': {r['Text']}"
        return f"No direct search summary found for '{query}'."
    except Exception as e:
        return f"Search error: {str(e)}"
