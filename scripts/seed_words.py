#!/usr/bin/env python3
"""
scripts/seed_words.py

Reads 600 TOEIC words JSON and seeds into Supabase database.
Idempotent: Uses upsert (unique keys lesson_number and lesson_id + word)
Environment variables:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
"""

import os
import sys
import json
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Try importing supabase
try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None


def find_data_file(custom_path: str | None = None) -> Path:
    if custom_path:
        p = Path(custom_path)
        if p.exists():
            return p
        raise FileNotFoundError(f"Specified file not found: {custom_path}")

    # Standard candidate paths
    candidates = [
        Path("data/600_toeic_words.json"),
        Path("data/words.json"),
        Path("../data/600_toeic_words.json"),
        Path("../data/words.json"),
    ]
    for c in candidates:
        if c.exists() and c.stat().st_size > 0:
            return c

    raise FileNotFoundError("Could not find data/600_toeic_words.json or data/words.json")


def load_words_data(file_path: Path) -> dict:
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def seed_database(data: dict, dry_run: bool = False):
    lessons = data.get("lessons", [])
    total_lessons_in_file = len(lessons)
    total_words_in_file = sum(len(l.get("words", [])) for l in lessons)

    print(f"📖 Loaded JSON file with {total_lessons_in_file} lessons and {total_words_in_file} words.")

    if dry_run:
        print("🔍 Dry run enabled. Validating JSON structure only...")
        for i, l in enumerate(lessons, start=1):
            assert "lesson_number" in l, f"Missing lesson_number in lesson index {i}"
            assert "title_en" in l, f"Missing title_en in lesson {l.get('lesson_number')}"
            assert "title_vi" in l, f"Missing title_vi in lesson {l.get('lesson_number')}"
            words = l.get("words", [])
            for w in words:
                assert "word" in w and w["word"], f"Missing word in lesson {l.get('lesson_number')}"
        print(f"✅ Data validation passed! {total_lessons_in_file} lessons, {total_words_in_file} words are valid.")
        return

    # Load environment variables
    load_dotenv()
    # Also look in backend/.env if not found
    if not os.getenv("SUPABASE_URL"):
        load_dotenv("backend/.env")

    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment or .env file.")
        print("   Please create a .env file or run with --dry-run.")
        sys.exit(1)

    if service_role_key.startswith("sb_publishable_"):
        print("\n" + "=" * 80)
        print("❌ LỖI CẤU HÌNH SUPABASE KEY:")
        print("   SUPABASE_SERVICE_ROLE_KEY trong backend/.env đang là Anon/Publishable key ('sb_publishable_...').")
        print("   Key này chỉ dùng cho Frontend và bị chặn bởi Row Level Security (RLS) khi ghi database.")
        print("👉 Cách khắc phục trong 30 giây:")
        print("   1. Vào Supabase Dashboard -> Project Settings -> API")
        print("   2. Tại mục 'Project API keys', tìm dòng 'service_role' (bấm Reveal để copy secret key)")
        print("   3. Dán key đó vào SUPABASE_SERVICE_ROLE_KEY trong file 'backend/.env'")
        print("=" * 80 + "\n")
        sys.exit(1)

    if create_client is None:
        print("❌ Error: supabase package is not installed. Run: pip install supabase")
        sys.exit(1)

    print(f"🔌 Connecting to Supabase at: {supabase_url}...")
    supabase: Client = create_client(supabase_url, service_role_key)

    lessons_upserted = 0
    words_upserted = 0

    print("🚀 Starting upsert process...")
    for l in lessons:
        lesson_num = int(l["lesson_number"])
        title_en = l["title_en"].strip()
        title_vi = l["title_vi"].strip()

        # Upsert lesson
        lesson_payload = {
            "lesson_number": lesson_num,
            "title_en": title_en,
            "title_vi": title_vi,
        }
        res = (
            supabase.table("lessons")
            .upsert(lesson_payload, on_conflict="lesson_number")
            .execute()
        )

        if not res.data:
            # Fallback query if on_conflict didn't return data
            res = (
                supabase.table("lessons")
                .select("id")
                .eq("lesson_number", lesson_num)
                .single()
                .execute()
            )
        lesson_id = res.data[0]["id"] if isinstance(res.data, list) else res.data["id"]
        lessons_upserted += 1

        # Prepare words for this lesson
        words_batch = []
        for w in l.get("words", []):
            word_text = w["word"].strip()
            if not word_text:
                continue
            words_batch.append({
                "lesson_id": lesson_id,
                "word": word_text,
                "part_of_speech": (w.get("part_of_speech") or "").strip(),
                "definition_en": (w.get("definition") or "").strip(),
                "related_forms": (w.get("related_forms") or "").strip(),
                "meaning_vi": (w.get("meaning_vi") or "").strip(),
            })

        if words_batch:
            w_res = (
                supabase.table("words")
                .upsert(words_batch, on_conflict="lesson_id,word")
                .execute()
            )
            words_upserted += len(words_batch)

        print(f"  ✓ Lesson {lesson_num:2d}: '{title_en}' ({len(words_batch)} words)")

    print("=" * 60)
    print(f"🎉 Seeding complete!")
    print(f"   Lessons upserted: {lessons_upserted}/{total_lessons_in_file}")
    print(f"   Words upserted:   {words_upserted}/{total_words_in_file}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Seed 600 TOEIC words into Supabase")
    parser.add_argument("--file", "-f", help="Path to words json file", default=None)
    parser.add_argument("--dry-run", action="store_true", help="Validate data without DB insertion")
    args = parser.parse_args()

    data_file = find_data_file(args.file)
    data = load_words_data(data_file)
    seed_database(data, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
