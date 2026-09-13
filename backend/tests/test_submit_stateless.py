import pytest
from fastapi.testclient import TestClient
from app.db.repository import get_repository

AUTH_HEADERS = {"Authorization": "Bearer test-token-submit-stateless-user"}


def test_submit_test_with_serverless_stateless_cold_start(client: TestClient):
    """
    Simulates:
    1. User starts a 10-question listening test (Instance A creates the session).
    2. User takes 2 minutes answering on the client.
    3. Serverless instance A shuts down / memory cache is cleared.
    4. Instance B (cold start) receives the submit request.
    5. Asserts that submit_test NEVER fails with 'session expired' or 500.
    6. Asserts status 200, score calculated, results returned, and answers recorded.
    """
    repo = get_repository()

    # Step 1: Create test session
    create_res = client.post(
        "/api/tests",
        json={
            "scope": "all",
            "test_type": "listening",
            "question_count": 10,
        },
        headers=AUTH_HEADERS,
    )
    assert create_res.status_code == 200
    test_session = create_res.json()
    test_id = test_session["id"]
    questions = test_session["questions"]
    assert len(questions) == 10

    # Step 2: Prepare user answers (half correct, half incorrect)
    answers = []
    for idx, q in enumerate(questions):
        wid = q["word_id"]
        target_word = q["audio_word"]
        # Alternate correct and intentionally wrong answer
        user_ans = target_word if idx % 2 == 0 else "wrong_answer_xyz"
        answers.append({
            "word_id": wid,
            "user_answer": user_ans,
            "question_type": q["question_type"],
        })

    # Step 3: SIMULATE SERVERLESS COLD START (Clear all memory caches)
    if hasattr(repo, "_cached_sessions"):
        repo._cached_sessions.clear()
    if hasattr(repo, "_mock_sessions"):
        # Keep only the session in DB/mock store, remove internal cached questions
        for s in repo._mock_sessions.values():
            s.pop("questions_internal", None)

    # Step 4: Submit to fresh instance
    submit_res = client.post(
        f"/api/tests/{test_id}/submit",
        json={"answers": answers},
        headers={
            **AUTH_HEADERS,
            "Origin": "https://toeic-600-words-hoandev.vercel.app",
        },
    )

    # Step 5: Assert submission succeeded
    assert submit_res.status_code == 200, f"Submit failed: {submit_res.text}"
    result = submit_res.json()
    assert result["id"] == test_id
    assert result["total_questions"] == 10
    assert result["correct_answers"] == 5
    assert result["score_percent"] == 50.0
    assert len(result["results"]) == 10

    # Step 6: Verify CORS headers are present
    assert submit_res.headers.get("access-control-allow-origin") == "https://toeic-600-words-hoandev.vercel.app"
