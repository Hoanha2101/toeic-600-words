from datetime import datetime, date
from typing import Dict, List, Optional
from pydantic import BaseModel


class UserStateUpdateRequest(BaseModel):
    current_lesson_id: Optional[int] = None
    current_word_index: Optional[int] = None
    current_mode: Optional[str] = None
    add_study_seconds: Optional[int] = 0


class UserStateSummary(BaseModel):
    total_words: int = 598
    words_learned: int = 0
    words_mastered: int = 0
    words_learning: int = 0
    words_new: int = 598
    overall_progress_percent: int = 0
    due_reviews_count: int = 0


class LessonProgressItem(BaseModel):
    lesson_id: int
    lesson_number: int
    words_total: int
    words_learned: int
    words_mastered: int
    is_completed: bool
    progress_percent: int


class WordProgressItem(BaseModel):
    word_id: int
    status: str
    ease_factor: float
    interval_days: float
    repetitions: int
    due_date: str
    is_marked_known: bool
    correct_count: int
    wrong_count: int


class AppInitStateResponse(BaseModel):
    user_id: str
    display_name: Optional[str] = None
    current_lesson_id: int
    current_lesson_number: int
    current_word_index: int
    current_mode: str
    streak_days: int
    last_streak_date: Optional[date] = None
    total_study_seconds: int
    summary: UserStateSummary
    lessons_progress: List[LessonProgressItem]
    word_progress_map: Dict[str, WordProgressItem] = {}
