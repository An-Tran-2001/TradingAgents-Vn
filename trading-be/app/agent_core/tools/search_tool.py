import os
from pathlib import Path
from typing import List
from langchain_core.tools import tool


@tool
def search_workspace(query: str, max_results: int = 10) -> str:
    """
    Search the repository workspace for occurrences of `query` in text files.
    Returns a short list of matches formatted as `relative_path:line_number: line`.
    Designed for use by the Orchestrator to let agents look up project docs or code.
    """
    if not query:
        return "No query provided."

    # Determine repo root (prefer current working directory)
    root = Path.cwd()

    matches: List[str] = []
    skipped_dirs = {".git", "node_modules", "__pycache__", ".venv", "venv"}

    try:
        for path in root.rglob("*"):
            if len(matches) >= max_results:
                break
            if path.is_dir():
                if path.name in skipped_dirs:
                    # skip these directories
                    continue
                else:
                    continue

            # Skip binary-ish files by extension
            if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".gif", ".zip", ".pyc", ".sqlite", ".db"}:
                continue

            # Skip very large files
            try:
                if path.stat().st_size > 2 * 1024 * 1024:  # 2MB
                    continue
            except Exception:
                continue

            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue

            for i, line in enumerate(text.splitlines()):
                if query.lower() in line.lower():
                    rel = os.path.relpath(path, root)
                    snippet = line.strip()
                    matches.append(f"{rel}:{i+1}: {snippet}")
                    break

    except Exception as e:
        return f"Search failed: {e}"

    if not matches:
        return "No results found."

    return "\n".join(matches[:max_results])
