import json
from pathlib import Path
from typing import Dict, List, Any


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
    raise FileNotFoundError("Could not find data/600_toeic_words.json or data/words.json")
