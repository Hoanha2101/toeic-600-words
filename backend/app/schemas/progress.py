from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel


class WordProgressResponse(BaseModel):
    word_id: int
    status: str
    ease_factor: float
    interval_days: float
    repetitions: int
    due_date: datetime
    correct_count: int
    wrong_count: int
    is_marked_known: bool
    last_reviewed_at: Optional[datetime] = None


class WordMarkRequest(BaseModel):
    is_marked_known: bool


class WordReviewRequest(BaseModel):
    rating: Literal["again", "hard", "good", "easy"]


class BatchMarkRequest(BaseModel):
    word_ids: List[int]
    is_marked_known: bool
