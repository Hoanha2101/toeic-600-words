from typing import List, Optional
from pydantic import BaseModel
from app.schemas.word import WordResponse


class LessonProgressSummary(BaseModel):
    words_total: int = 0
    words_learned: int = 0
    words_mastered: int = 0
    is_completed: bool = False
    progress_percent: int = 0


class LessonResponse(BaseModel):
    id: int
    lesson_number: int
    title_en: str
    title_vi: str
    progress: LessonProgressSummary


class LessonWithWordsResponse(LessonResponse):
    words: List[WordResponse] = []
