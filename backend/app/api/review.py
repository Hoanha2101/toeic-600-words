from typing import List
from fastapi import APIRouter, Depends
from app.core.security import get_current_user, AuthUser
from app.db.repository import get_repository
from app.schemas.word import WordResponse

router = APIRouter()


@router.get("/review/due", response_model=List[WordResponse])
def get_due_reviews(current_user: AuthUser = Depends(get_current_user)):
    repo = get_repository()
    return repo.get_due_reviews(current_user.user_id)
