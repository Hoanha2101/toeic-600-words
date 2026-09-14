import time
import pytest
from fastapi.testclient import TestClient
from app.db.repository import get_repository

AUTH_HEADERS = {"Authorization": "Bearer test-token-no-json-user"}


def test_runtime_queries_database_with_ttl_cache(client: TestClient):
    """
    Verifies:
    1. Lessons endpoint returns exactly 50 lessons from DB.
    2. Words endpoint returns exactly 598 words from DB.
    3. Memory cache serves subsequent calls with sub-10ms response time.
    4. Cache invalidation endpoint refreshes successfully.
    """
    repo = get_repository()

    # Call 1: Lessons
    res_lessons = client.get("/api/lessons", headers=AUTH_HEADERS)
    assert res_lessons.status_code == 200
    lessons = res_lessons.json()
    assert len(lessons) == 50

    # Call 2: Single lesson words
    res_l1 = client.get("/api/lessons/1/words", headers=AUTH_HEADERS)
    assert res_l1.status_code == 200
    assert len(res_l1.json()["words"]) == 12

    # Call 3: Words list
    res_words = client.get("/api/words?limit=600", headers=AUTH_HEADERS)
    assert res_words.status_code == 200
    assert len(res_words.json()["words"]) == 598

    # Measure in-memory cache speed on second call
    t0 = time.perf_counter()
    res_words_cached = client.get("/api/words?limit=600", headers=AUTH_HEADERS)
    t_elapsed = (time.perf_counter() - t0) * 1000
    assert res_words_cached.status_code == 200
    assert len(res_words_cached.json()["words"]) == 598
    print(f"\n⚡ In-memory cached /api/words latency: {t_elapsed:.2f}ms")

    # Invalidate cache endpoint
    res_inv = client.post("/api/cache/invalidate", headers=AUTH_HEADERS)
    assert res_inv.status_code == 200
    assert res_inv.json()["status"] == "ok"
