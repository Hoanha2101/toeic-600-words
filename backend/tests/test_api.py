from fastapi.testclient import TestClient

AUTH_HEADERS = {"Authorization": "Bearer test-token-user-api-test"}


def test_health_check(client: TestClient):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_list_lessons_and_word_count(client: TestClient):
    res = client.get("/api/lessons", headers=AUTH_HEADERS)
    assert res.status_code == 200
    lessons = res.json()
    assert len(lessons) == 50

    total_words = sum(l["progress"]["words_total"] for l in lessons)
    assert total_words == 598


def test_get_single_lesson_words(client: TestClient):
    res = client.get("/api/lessons/1/words", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["lesson_number"] == 1
    assert data["title_en"] == "Contracts"
    assert len(data["words"]) == 12
    # Verify first word
    w1 = data["words"][0]
    assert w1["word"] == "Abide by"
    assert w1["status"] == "new"


def test_words_filter_and_search(client: TestClient):
    # Search by word
    res = client.get("/api/words?search=abide", headers=AUTH_HEADERS)
    assert res.status_code == 200
    items = res.json()["words"]
    assert len(items) >= 1
    assert any("abide" in w["word"].lower() for w in items)

    # Search by Vietnamese meaning
    res_vi = client.get("/api/words?search=hợp đồng", headers=AUTH_HEADERS)
    assert res_vi.status_code == 200
    assert res_vi.json()["total"] >= 1


def test_cache_audio_url(client: TestClient):
    patch_res = client.patch(
        "/api/words/1/audio",
        json={"audio_url": "https://api.dictionaryapi.dev/media/pronunciations/en/abide-us.mp3"},
        headers=AUTH_HEADERS,
    )
    assert patch_res.status_code == 200
    assert "abide-us.mp3" in patch_res.json()["audio_url"]

    # Verify get word returns cached audio
    get_res = client.get("/api/words/1", headers=AUTH_HEADERS)
    assert get_res.status_code == 200
    assert get_res.json()["audio_url"] == "https://api.dictionaryapi.dev/media/pronunciations/en/abide-us.mp3"


def test_mark_word_and_batch_mark(client: TestClient):
    # Mark single word
    m_res = client.post(
        "/api/progress/word/1/mark",
        json={"is_marked_known": True},
        headers=AUTH_HEADERS,
    )
    assert m_res.status_code == 200
    assert m_res.json()["is_marked_known"] is True
    assert m_res.json()["status"] == "learned"

    # Batch mark words 2, 3, 4
    bm_res = client.post(
        "/api/progress/batch-mark",
        json={"word_ids": [2, 3, 4], "is_marked_known": True},
        headers=AUTH_HEADERS,
    )
    assert bm_res.status_code == 200
    assert bm_res.json()["count"] == 3


def test_create_and_submit_quiz(client: TestClient):
    # Create a 10-question mixed test on Lesson 1
    create_res = client.post(
        "/api/tests",
        json={
            "scope": "lesson",
            "lesson_ids": [1],
            "test_type": "mixed",
            "question_count": 10,
        },
        headers=AUTH_HEADERS,
    )
    assert create_res.status_code == 200
    test_session = create_res.json()
    assert test_session["total_questions"] == 10
    assert len(test_session["questions"]) == 10
    test_id = test_session["id"]

    # Verify answers are masked in prompt
    for q in test_session["questions"]:
        assert "correct_answer" not in q

    # Submit test with dummy answers
    answers = [
        {"word_id": q["word_id"], "user_answer": "random_guess"}
        for q in test_session["questions"]
    ]
    sub_res = client.post(
        f"/api/tests/{test_id}/submit",
        json={"answers": answers},
        headers=AUTH_HEADERS,
    )
    assert sub_res.status_code == 200
    res_data = sub_res.json()
    assert res_data["total_questions"] == 10
    assert "score_percent" in res_data
    assert len(res_data["results"]) == 10

    # Test history should now show this test
    hist_res = client.get("/api/tests/history", headers=AUTH_HEADERS)
    assert hist_res.status_code == 200
    assert len(hist_res.json()) >= 1
    assert hist_res.json()[0]["id"] == test_id
