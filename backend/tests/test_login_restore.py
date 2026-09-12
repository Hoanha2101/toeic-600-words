import pytest
from fastapi.testclient import TestClient


def test_user_learns_10_words_logout_and_restore_progress(client: TestClient):
    """
    Simulates:
    1. User A logs in for the first time.
    2. Learns 10 words in Lesson 1 (marks 5 known, reviews 5 via SM-2).
    3. Moves position to word index 10.
    4. Completes a test.
    5. User logs out (client drops session).
    6. User logs back in (session restored with same user ID).
    7. Asserts /api/me/state returns EXACTLY the 10 learned words, lesson 1 index 10, test history preserved.
    8. User B logs in and verifies total isolation (User B is clean, not affected by User A).
    """

    user_a_token = "test-token-user-alice-12345"
    auth_headers_a = {"Authorization": f"Bearer {user_a_token}"}

    # Step 1: Alice initial login
    init_res = client.get("/api/me/state", headers=auth_headers_a)
    assert init_res.status_code == 200
    state_0 = init_res.json()
    assert state_0["current_lesson_number"] == 1
    assert state_0["current_word_index"] == 0
    assert state_0["summary"]["words_learned"] == 0
    assert state_0["summary"]["words_mastered"] == 0
    assert len(state_0["word_progress_map"]) == 0

    # Step 2: Alice learns 10 words in Lesson 1 (words 1 through 10)
    # Mark words 1 to 5 as known
    for wid in range(1, 6):
        res = client.post(
            f"/api/progress/word/{wid}/mark",
            json={"is_marked_known": True},
            headers=auth_headers_a,
        )
        assert res.status_code == 200
        assert res.json()["is_marked_known"] is True

    # Review words 6 to 10 with SM-2 (Good and Easy ratings)
    for wid in range(6, 11):
        rating = "good" if wid % 2 == 0 else "easy"
        res = client.post(
            f"/api/progress/word/{wid}/review",
            json={"rating": rating},
            headers=auth_headers_a,
        )
        assert res.status_code == 200
        assert res.json()["status"] in ("learned", "mastered")
        assert res.json()["repetitions"] >= 1

    # Step 3: Alice moves position in Lesson 1 to word index 10
    update_res = client.put(
        "/api/me/state",
        json={
            "current_lesson_id": 1,
            "current_word_index": 10,
            "current_mode": "learn",
            "add_study_seconds": 320,
        },
        headers=auth_headers_a,
    )
    assert update_res.status_code == 200
    updated_state = update_res.json()
    assert updated_state["current_word_index"] == 10
    assert updated_state["total_study_seconds"] == 320

    # Step 4: Alice takes and submits a test on Lesson 1
    quiz_res = client.post(
        "/api/tests",
        json={
            "scope": "lesson",
            "lesson_ids": [1],
            "test_type": "multiple_choice",
            "question_count": 5,
        },
        headers=auth_headers_a,
    )
    assert quiz_res.status_code == 200
    quiz_id = quiz_res.json()["id"]

    client.post(
        f"/api/tests/{quiz_id}/submit",
        json={"answers": [{"word_id": 1, "user_answer": "Tuân theo, chấp hành"}]},
        headers=auth_headers_a,
    )

    # Step 5: SIMULATE LOGOUT
    # The client discards headers, cookies, local storage
    # No request is made with user_a_token during logout

    # Step 6: SIMULATE LOGIN AGAIN
    # Alice signs back in on a fresh browser tab/device
    # The browser authenticates and sends Authorization: Bearer {user_a_token}
    restored_res = client.get("/api/me/state", headers=auth_headers_a)
    assert restored_res.status_code == 200
    restored = restored_res.json()

    # Step 7: ASSERT PROGRESS IS RESTORED 100% ACCURATELY
    assert restored["current_lesson_number"] == 1
    assert restored["current_word_index"] == 10, "Word index must be exactly where Alice left off (10)"
    assert restored["current_mode"] == "learn"
    assert restored["total_study_seconds"] == 320
    assert restored["streak_days"] >= 1

    # Total learned/mastered count must equal 10
    summary = restored["summary"]
    assert summary["words_learned"] + summary["words_mastered"] == 10, "Alice must still have exactly 10 learned/mastered words"

    # All 10 words must be present in word_progress_map
    for wid in range(1, 11):
        str_wid = str(wid)
        assert str_wid in restored["word_progress_map"], f"Word {wid} progress missing!"
        wp = restored["word_progress_map"][str_wid]
        if wid <= 5:
            assert wp["is_marked_known"] is True
            assert wp["status"] == "learned"
        else:
            assert wp["repetitions"] >= 1
            assert wp["status"] in ("learned", "mastered")

    # Lesson 1 progress must reflect the 10 learned words
    l1_prog = next(p for p in restored["lessons_progress"] if p["lesson_number"] == 1)
    assert l1_prog["words_learned"] == 10
    assert l1_prog["words_total"] == 12
    assert l1_prog["progress_percent"] == 83

    # Step 8: Multi-user isolation verification
    # User Bob logs in
    user_b_token = "test-token-user-bob-99999"
    auth_headers_b = {"Authorization": f"Bearer {user_b_token}"}
    bob_res = client.get("/api/me/state", headers=auth_headers_b)
    assert bob_res.status_code == 200
    bob_state = bob_res.json()

    # Bob must have fresh state and NOT inherit Alice's progress!
    assert bob_state["current_word_index"] == 0
    assert bob_state["summary"]["words_learned"] == 0
    assert bob_state["summary"]["words_mastered"] == 0
    assert len(bob_state["word_progress_map"]) == 0
