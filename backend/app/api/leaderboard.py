from typing import Optional, Literal
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user, AuthUser
from app.db.repository import get_repository
from app.schemas.leaderboard import LeaderboardResponse, LeaderboardItem

router = APIRouter()

SortByType = Literal["words_learned", "words_mastered", "avg_test_score", "streak_days", "total_study_seconds"]


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(
    sort_by: SortByType = Query("words_learned"),
    limit: int = Query(50, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
):
    repo = get_repository()
    return repo.get_leaderboard(current_user.user_id, sort_by=sort_by, limit=limit)


@router.get("/leaderboard/me", response_model=LeaderboardItem)
def get_my_leaderboard_rank(
    sort_by: SortByType = Query("words_learned"),
    current_user: AuthUser = Depends(get_current_user),
):
    repo = get_repository()
    return repo.get_my_leaderboard_rank(current_user.user_id, sort_by=sort_by)
