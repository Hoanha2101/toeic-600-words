import pytest
from fastapi.testclient import TestClient

AUTH_HEADERS = {"Authorization": "Bearer test-token-leaderboard-user"}


def test_get_leaderboard_endpoints(client: TestClient):
    for sort_field in ["words_learned", "words_mastered", "avg_test_score", "streak_days", "total_study_seconds"]:
        res = client.get(f"/api/leaderboard?sort_by={sort_field}&limit=20", headers=AUTH_HEADERS)
        assert res.status_code == 200
        data = res.json()
        assert data["sort_by"] == sort_field
        assert "items" in data
        assert len(data["items"]) >= 1

        # Check rankings are 1, 2, 3...
        for idx, item in enumerate(data["items"], start=1):
            assert item["rank"] == idx
            assert "display_name" in item
            assert "words_learned" in item
            assert "words_mastered" in item
            assert "avg_test_score" in item
            assert "streak_days" in item
            assert "total_study_seconds" in item

        # Check my_rank
        assert data["my_rank"] is not None
        assert data["my_rank"]["is_current_user"] is True


def test_get_my_leaderboard_rank(client: TestClient):
    res = client.get("/api/leaderboard/me?sort_by=words_learned", headers=AUTH_HEADERS)
    assert res.status_code == 200
    my_rank = res.json()
    assert my_rank["rank"] >= 1
    assert my_rank["is_current_user"] is True
