from typing import List, Optional, Literal
from pydantic import BaseModel


class LeaderboardItem(BaseModel):
    rank: int
    user_id: str
    display_name: str
    words_learned: int = 0
    words_mastered: int = 0
    avg_test_score: float = 0.0
    streak_days: int = 0
    total_study_seconds: int = 0
    is_current_user: bool = False


class LeaderboardResponse(BaseModel):
    sort_by: str
    items: List[LeaderboardItem]
    my_rank: Optional[LeaderboardItem] = None
