from typing import List, Optional
from pydantic import BaseModel


class StatusBreakdown(BaseModel):
    new: int = 598
    learning: int = 0
    learned: int = 0
    mastered: int = 0


class UrgentLesson(BaseModel):
    lesson_id: int
    lesson_number: int
    title_en: str
    title_vi: str
    due_count: int
    total_words: int
    learned_words: int


class DashboardSummaryResponse(BaseModel):
    total_words: int = 598
    words_learned_or_mastered: int = 0
    overall_progress_percent: int = 0
    status_breakdown: StatusBreakdown
    streak_days: int = 0
    total_study_seconds: int = 0
    due_reviews_count: int = 0
    urgent_lessons: List[UrgentLesson] = []
