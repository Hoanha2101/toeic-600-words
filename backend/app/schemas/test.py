from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel


class CreateTestRequest(BaseModel):
    lesson_ids: Optional[List[int]] = None
    scope: Literal["lesson", "multi_lesson", "all", "learning_only"] = "lesson"
    test_type: Literal["multiple_choice", "reverse", "listening", "fill_blank", "mixed"] = "mixed"
    question_count: int = 10


class OptionDetail(BaseModel):
    text: str
    word: Optional[str] = None
    part_of_speech: Optional[str] = None
    meaning_vi: Optional[str] = None
    definition_en: Optional[str] = None


class TestQuestion(BaseModel):
    question_index: int
    word_id: int
    question_type: str
    prompt: str
    audio_url: Optional[str] = None
    audio_word: Optional[str] = None
    audio_word_id: Optional[int] = None
    options: Optional[List[str]] = None
    options_detail: Optional[List[OptionDetail]] = None
    blank_length: Optional[int] = None
    hint: Optional[str] = None


class TestSessionResponse(BaseModel):
    id: str
    test_type: str
    total_questions: int
    questions: List[TestQuestion]


class SubmitTestAnswer(BaseModel):
    word_id: int
    user_answer: str
    question_type: Optional[str] = None


class SubmitTestRequest(BaseModel):
    answers: List[SubmitTestAnswer]


class TestResultAnswer(BaseModel):
    word_id: int
    word: str
    meaning_vi: str
    part_of_speech: Optional[str] = None
    definition_en: Optional[str] = None
    question_type: str
    user_answer: str
    correct_answer: str
    is_correct: bool


class TestResultResponse(BaseModel):
    id: str
    test_type: str
    total_questions: int
    correct_answers: int
    score_percent: float
    results: List[TestResultAnswer]
    started_at: datetime
    finished_at: datetime


class TestHistoryItem(BaseModel):
    id: str
    test_type: str
    total_questions: int
    correct_answers: int
    score_percent: float
    started_at: datetime
    finished_at: Optional[datetime] = None
