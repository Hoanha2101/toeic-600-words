"""
backend/app/db/data_loader.py

Seed / Offline Test Data Loader ONLY.
NOTE: This module is strictly for offline testing (MOCK_DB=True) and seeding.
Production runtime queries Supabase Postgres directly and never uses this file.
"""

import json
from pathlib import Path
from typing import Dict, Any


def load_toeic_data() -> Dict[str, Any]:
    candidates = [
        Path("data/600_toeic_words.json"),
        Path("data/words.json"),
        Path("../data/600_toeic_words.json"),
        Path("../data/words.json"),
        Path(__file__).resolve().parent.parent.parent.parent / "data" / "600_toeic_words.json",
        Path(__file__).resolve().parent.parent.parent.parent / "data" / "words.json",
    ]
    for p in candidates:
        if p.exists() and p.stat().st_size > 0:
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)

    # Minimal fallback mock dataset if running in isolation without data files
    return {
        "title": "600 Essential Words for TOEIC (Mock)",
        "total_lessons": 1,
        "total_words": 1,
        "lessons": [
            {
                "lesson_number": 1,
                "title_en": "Contracts",
                "title_vi": "Hợp đồng",
                "words": [
                    {
                        "word": "Abide by",
                        "part_of_speech": "v.",
                        "definition": "to comply with, to conform",
                        "related_forms": "",
                        "meaning_vi": "Tuân theo, chấp hành",
                    }
                ],
            }
        ],
    }
