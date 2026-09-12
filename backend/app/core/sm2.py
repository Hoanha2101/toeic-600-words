from datetime import datetime, timedelta, timezone
from typing import Literal, Tuple

RatingType = Literal["again", "hard", "good", "easy"]
StatusType = Literal["new", "learning", "learned", "mastered"]


def calculate_sm2(
    rating: RatingType,
    repetitions: int = 0,
    interval_days: float = 0.0,
    ease_factor: float = 2.5,
    correct_count: int = 0,
    wrong_count: int = 0,
    current_status: StatusType = "new",
    is_marked_known: bool = False,
    now: datetime | None = None,
) -> dict:
    """
    Implements modified SM-2 spaced repetition algorithm for vocabulary learning.
    Returns dictionary with updated values:
    repetitions, interval_days, ease_factor, due_date, status, correct_count, wrong_count, last_reviewed_at
    """
    if now is None:
        now = datetime.now(timezone.utc)

    # Ensure ease factor has base
    ef = max(1.3, float(ease_factor or 2.5))
    interval = float(interval_days or 0.0)
    reps = int(repetitions or 0)
    c_count = int(correct_count or 0)
    w_count = int(wrong_count or 0)

    if rating == "again":
        reps = 0
        interval = 1.0
        ef = max(1.3, ef - 0.2)
        status: StatusType = "learning"
        w_count += 1
    elif rating == "hard":
        if reps == 0:
            interval = 1.0
        else:
            interval = max(1.0, interval * 1.2)
        ef = max(1.3, ef - 0.15)
        status: StatusType = "learning"
        # Hard counts neither pure wrong nor full easy, keep counts or increment c_count
    elif rating == "good":
        if reps == 0:
            interval = 1.0
        elif reps == 1:
            interval = 6.0
        else:
            interval = interval * ef
        reps += 1
        c_count += 1
        status = "mastered" if reps >= 2 else "learned"
    elif rating == "easy":
        if reps == 0:
            interval = 2.0
        elif reps == 1:
            interval = 8.0
        else:
            interval = interval * ef * 1.3
        ef += 0.15
        reps += 1
        c_count += 1
        status = "mastered" if reps >= 2 else "learned"
    else:
        raise ValueError(f"Invalid rating: {rating}")

    if is_marked_known and status == "learning":
        status = "learned"

    due_date = now + timedelta(days=interval)

    return {
        "repetitions": reps,
        "interval_days": round(interval, 2),
        "ease_factor": round(ef, 2),
        "due_date": due_date,
        "status": status,
        "correct_count": c_count,
        "wrong_count": w_count,
        "last_reviewed_at": now,
    }
