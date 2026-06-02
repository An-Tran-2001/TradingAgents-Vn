from __future__ import annotations

from typing import Optional

LANGUAGE_CODE_MAP = {
    "en": "English",
    "english": "English",
    "vi": "Vietnamese",
    "vietnamese": "Vietnamese",
    "ja": "Japanese",
    "japanese": "Japanese",
    "zh": "Chinese",
    "chinese": "Chinese",
    "fr": "French",
    "french": "French",
    "es": "Spanish",
    "spanish": "Spanish",
    "de": "German",
    "german": "German",
    "ko": "Korean",
    "korean": "Korean",
    "pt": "Portuguese",
    "portuguese": "Portuguese",
}


def normalize_language(lang: Optional[str] = None) -> str:
    if not lang:
        return "English"
    normalized_key = str(lang).strip().lower()
    return LANGUAGE_CODE_MAP.get(normalized_key, str(lang).strip().title())
