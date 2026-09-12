from fastapi import APIRouter, Depends
from app.core.security import get_current_user, AuthUser
from app.db.repository import get_repository
from app.schemas.dashboard import DashboardSummaryResponse

router = APIRouter()


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(current_user: AuthUser = Depends(get_current_user)):
    repo = get_repository()
    return repo.get_dashboard_summary(current_user.user_id)
