from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user, AuthUser
from app.db.repository import get_repository
from app.schemas.progress import WordProgressResponse, WordMarkRequest, WordReviewRequest, BatchMarkRequest

router = APIRouter()


@router.post("/progress/word/{word_id}/mark", response_model=WordProgressResponse)
def mark_word(
    word_id: int,
    payload: WordMarkRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    repo = get_repository()
    try:
        updated = repo.mark_word_known(current_user.user_id, word_id, payload.is_marked_known)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/progress/word/{word_id}/review", response_model=WordProgressResponse)
def review_word(
    word_id: int,
    payload: WordReviewRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    repo = get_repository()
    try:
        updated = repo.review_word(current_user.user_id, word_id, payload.rating)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/progress/batch-mark")
def batch_mark_words(
    payload: BatchMarkRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    repo = get_repository()
    count = repo.batch_mark_words(current_user.user_id, payload.word_ids, payload.is_marked_known)
    return {"message": f"Successfully updated {count} words", "count": count}
