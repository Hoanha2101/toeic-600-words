from fastapi import APIRouter, Depends
from app.core.security import get_current_user, AuthUser
from app.db.repository import get_repository
from app.schemas.user_state import AppInitStateResponse, UserStateUpdateRequest

router = APIRouter()


@router.get("/me/state", response_model=AppInitStateResponse)
def get_my_state(current_user: AuthUser = Depends(get_current_user)):
    repo = get_repository()
    state = repo.get_user_state(current_user.user_id, display_name=current_user.email.split("@")[0] if current_user.email else "User")
    return state


@router.put("/me/state", response_model=AppInitStateResponse)
def update_my_state(
    payload: UserStateUpdateRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    repo = get_repository()
    updated_state = repo.update_user_state(
        user_id=current_user.user_id,
        current_lesson_id=payload.current_lesson_id,
        current_word_index=payload.current_word_index,
        current_mode=payload.current_mode,
        add_study_seconds=payload.add_study_seconds or 0,
    )
    return updated_state
