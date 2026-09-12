from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok", "message": "600 Essential Words TOEIC API is running"}
