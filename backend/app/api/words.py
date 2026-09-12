from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.security import get_current_user, AuthUser
from app.db.repository import get_repository
from app.schemas.word import WordResponse, WordAudioUpdate

router = APIRouter()


@router.get("/words")
def list_words(
    lesson_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=600),
    offset: int = Query(0, ge=0),
    current_user: AuthUser = Depends(get_current_user),
):
    repo = get_repository()
    return repo.get_all_words(
        user_id=current_user.user_id,
        lesson_id=lesson_id,
        status=status,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get("/words/{word_id}", response_model=WordResponse)
def get_word(word_id: int, current_user: AuthUser = Depends(get_current_user)):
    repo = get_repository()
    word = repo.get_word(word_id, current_user.user_id)
    if not word:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Word not found")
    return word


@router.patch("/words/{word_id}/audio")
def update_word_audio(
    word_id: int,
    payload: WordAudioUpdate,
    current_user: AuthUser = Depends(get_current_user),
):
    repo = get_repository()
    res = repo.update_word_audio(word_id, payload.audio_url, payload.audio_url_uk)
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Word not found")
    return {"message": "Audio URL cached successfully", "audio_url": payload.audio_url}
