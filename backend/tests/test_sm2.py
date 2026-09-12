from datetime import datetime, timezone, timedelta
from app.core.sm2 import calculate_sm2


def test_sm2_again_rating():
    now = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    res = calculate_sm2(
        rating="again",
        repetitions=3,
        interval_days=10.0,
        ease_factor=2.5,
        correct_count=3,
        wrong_count=1,
        current_status="mastered",
        now=now,
    )
    assert res["repetitions"] == 0
    assert res["interval_days"] == 1.0
    assert res["ease_factor"] == 2.3
    assert res["status"] == "learning"
    assert res["wrong_count"] == 2
    assert res["due_date"] == now + timedelta(days=1)


def test_sm2_hard_rating():
    now = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    res = calculate_sm2(
        rating="hard",
        repetitions=1,
        interval_days=5.0,
        ease_factor=2.5,
        now=now,
    )
    assert res["repetitions"] == 1
    assert res["interval_days"] == 6.0  # 5 * 1.2
    assert res["ease_factor"] == 2.35  # 2.5 - 0.15
    assert res["status"] == "learning"


def test_sm2_good_progression():
    now = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    # First review: Good -> interval 1 day
    r1 = calculate_sm2(rating="good", repetitions=0, interval_days=0.0, ease_factor=2.5, now=now)
    assert r1["repetitions"] == 1
    assert r1["interval_days"] == 1.0
    assert r1["status"] == "learned"

    # Second review: Good -> interval 6 days
    r2 = calculate_sm2(rating="good", repetitions=r1["repetitions"], interval_days=r1["interval_days"], ease_factor=r1["ease_factor"], now=now)
    assert r2["repetitions"] == 2
    assert r2["interval_days"] == 6.0
    assert r2["status"] == "mastered"

    # Third review: Good -> interval 6 * 2.5 = 15 days
    r3 = calculate_sm2(rating="good", repetitions=r2["repetitions"], interval_days=r2["interval_days"], ease_factor=r2["ease_factor"], now=now)
    assert r3["repetitions"] == 3
    assert r3["interval_days"] == 15.0
    assert r3["status"] == "mastered"


def test_sm2_easy_progression():
    now = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    r1 = calculate_sm2(rating="easy", repetitions=0, interval_days=0.0, ease_factor=2.5, now=now)
    assert r1["repetitions"] == 1
    assert r1["interval_days"] == 2.0
    assert r1["ease_factor"] == 2.65
    assert r1["status"] == "learned"

    r2 = calculate_sm2(rating="easy", repetitions=r1["repetitions"], interval_days=r1["interval_days"], ease_factor=r1["ease_factor"], now=now)
    assert r2["repetitions"] == 2
    assert r2["interval_days"] == 8.0
    assert r2["ease_factor"] == 2.80
    assert r2["status"] == "mastered"
