from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user, AuthUser
from app.db.repository import get_repository
from app.schemas.lesson import LessonResponse, LessonWithWordsResponse

router = APIRouter()


@router.get("/lessons", response_model=List[LessonResponse])
def list_lessons(current_user: AuthUser = Depends(get_current_user)):
    repo = get_repository()
    return repo.get_lessons(current_user.user_id)


@router.get("/lessons/{lesson_id}/words", response_model=LessonWithWordsResponse)
def get_lesson_words(lesson_id: int, current_user: AuthUser = Depends(get_current_user)):
    repo = get_repository()
    lesson_data = repo.get_lesson_words(lesson_id, current_user.user_id)
    if not lesson_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return lesson_data
