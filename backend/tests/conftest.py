import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend folder is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.db.repository import get_repository


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_repo():
    # Keep static data loaded, clear dynamic user data between test runs if needed
    repo = get_repository()
    if hasattr(repo, "user_states"):
        repo.user_states.clear()
        repo.user_word_progress.clear()
        repo.test_sessions.clear()
        repo.test_answers.clear()
    if hasattr(repo, "_mock_states"):
        repo._mock_states.clear()
        repo._mock_progress.clear()
        repo._mock_sessions.clear()
        repo._mock_answers.clear()
        repo._cached_sessions.clear()
    yield
