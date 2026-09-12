from typing import Optional
from pydantic import BaseModel


class WordBase(BaseModel):
    id: int
    lesson_id: int
    word: str
    part_of_speech: Optional[str] = None
    definition_en: Optional[str] = None
    related_forms: Optional[str] = None
    meaning_vi: Optional[str] = None
    audio_url: Optional[str] = None
    audio_url_uk: Optional[str] = None


class WordResponse(WordBase):
    # progress of the current user
    status: Optional[str] = "new"
    ease_factor: Optional[float] = 2.5
    interval_days: Optional[float] = 0.0
    repetitions: Optional[int] = 0
    due_date: Optional[str] = None
    is_marked_known: Optional[bool] = False
    correct_count: Optional[int] = 0
    wrong_count: Optional[int] = 0


class WordAudioUpdate(BaseModel):
    audio_url: str
    audio_url_uk: Optional[str] = None
