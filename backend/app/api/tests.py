from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user, AuthUser
from app.db.repository import get_repository
from app.schemas.test import (
    CreateTestRequest,
    TestSessionResponse,
    SubmitTestRequest,
    TestResultResponse,
    TestHistoryItem,
)

router = APIRouter()


@router.post("/tests", response_model=TestSessionResponse)
def create_test(
    payload: CreateTestRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    repo = get_repository()
    return repo.create_test(
        user_id=current_user.user_id,
        scope=payload.scope,
        lesson_ids=payload.lesson_ids,
        test_type=payload.test_type,
        question_count=payload.question_count,
    )


@router.post("/tests/{test_id}/submit", response_model=TestResultResponse)
def submit_test(
    test_id: str,
    payload: SubmitTestRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    repo = get_repository()
    try:
        answers = [a.model_dump() for a in payload.answers]
        result = repo.submit_test(current_user.user_id, test_id, answers)
        return result
    except ValueError as e:
        print(f"⚠️ submit_test ValueError for test {test_id}: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ submit_test unexpected error for test {test_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi chấm điểm bài test: {str(e)}"
        )


@router.get("/tests/history", response_model=List[TestHistoryItem])
def get_test_history(current_user: AuthUser = Depends(get_current_user)):
    repo = get_repository()
    return repo.get_test_history(current_user.user_id)
