from __future__ import annotations

import datetime
from typing import Optional


def normalize_analysis_date(date_str: Optional[str]) -> Optional[str]:
    """Normalize an analysis datetime/date string to YYYY-MM-DD.

    Accepts standard ISO 8601 date/time strings as well as common date
    formats used by the frontend or CLI.
    """
    if not date_str:
        return None

    date_str = str(date_str).strip()

    # Handle ISO 8601 datetime values like 2026-06-02T15:30:00, including Z/offset.
    if "T" in date_str:
        if date_str.endswith("Z"):
            date_str = date_str[:-1] + "+00:00"
        try:
            return datetime.datetime.fromisoformat(date_str).date().isoformat()
        except ValueError:
            pass

    for fmt in (
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%m-%d-%Y",
        "%m/%d/%Y",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d %H:%M",
    ):
        try:
            return datetime.datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None
