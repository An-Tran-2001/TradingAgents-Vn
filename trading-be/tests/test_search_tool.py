from app.agent_core.tools.search_tool import search_workspace


def test_search_workspace_empty_query():
    result = search_workspace.invoke({"query": ""})
    assert isinstance(result, str)
    assert "No query provided" in result
