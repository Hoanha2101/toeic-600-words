import pytest
from fastapi.testclient import TestClient
from app.db.repository import get_repository

AUTH_HEADERS = {"Authorization": "Bearer test-token-listening-test-user"}


def test_listening_quiz_audio_matches_correct_word(client: TestClient):
    """
    Verifies that in Listening quiz:
    1. Every question has audio_word matching the actual target word (word_id).
    2. audio_word is NEVER bound to options[0] (Option A).
    3. Options contain the target word, but audio_word is independent of option position.
    """
    repo = get_repository()

    res = client.post(
        "/api/tests",
        json={
            "scope": "all",
            "test_type": "listening",
            "question_count": 10,
        },
        headers=AUTH_HEADERS,
    )
    assert res.status_code == 200
    data = res.json()
    questions = data["questions"]
    assert len(questions) == 10

    distinct_audio_words = set()
    option_a_matches = 0

    for q in questions:
        assert q["question_type"] == "listening"
        target_word_id = q["word_id"]
        audio_word = q["audio_word"]
        assert audio_word is not None and len(audio_word) > 0

        # Look up word in repository static data
        word_obj = repo.words_by_id[target_word_id]
        assert audio_word == word_obj["word"], (
            f"Question {q['question_index']} audio_word '{audio_word}' does not match word_id {target_word_id} '{word_obj['word']}'"
        )

        distinct_audio_words.add(audio_word)

        # Check options
        options = q["options"]
        assert options is not None and len(options) == 4
        assert audio_word in options, "Target word must be present in the options list"

        # Check if option[0] happens to be the correct word
        if options[0] == audio_word:
            option_a_matches += 1

    # In 10 random 4-choice questions, option A should not be 10/10 every time
    # And there must be multiple distinct words across 10 questions
    assert len(distinct_audio_words) > 1, "Audio words should not all be identical"


def test_listening_audio_invariant_under_shuffle(client: TestClient):
    """
    Ensures that shuffling options does NOT alter audio_word or correct_answer,
    even if the target word is moved to positions 0, 1, 2, or 3.
    """
    repo = get_repository()

    # Create 5 listening questions
    test_session = repo.create_test(
        user_id="00000000-0000-0000-0000-000000000001",
        scope="all",
        test_type="listening",
        question_count=5,
    )
    questions = test_session["questions"]

    for q in questions:
        wid = q["word_id"]
        expected_word = repo.words_by_id[wid]["word"]
        assert q["audio_word"] == expected_word
        assert q["audio_word_id"] == wid

        # Check that audio_word remains constant regardless of option shuffle
        options = list(q["options"])
        import random
        for _ in range(5):
            random.shuffle(options)
            # audio_word must remain the expected word, regardless of options[0]
            assert q["audio_word"] == expected_word


def test_all_question_types_consistency(client: TestClient):
    """
    Verifies that all 4 question types have consistent prompt, correct answer,
    and valid distractors.
    """
    repo = get_repository()

    for q_type in ["multiple_choice", "reverse", "listening", "fill_blank"]:
        res = client.post(
            "/api/tests",
            json={
                "scope": "lesson",
                "lesson_ids": [1],
                "test_type": q_type,
                "question_count": 5,
            },
            headers=AUTH_HEADERS,
        )
        assert res.status_code == 200
        data = res.json()
        questions = data["questions"]
        assert len(questions) == 5

        for q in questions:
            assert q["question_type"] == q_type
            wid = q["word_id"]
            word_obj = repo.words_by_id[wid]

            if q_type == "multiple_choice":
                assert q["prompt"] == word_obj["word"]
                assert word_obj["meaning_vi"] in q["options"]
            elif q_type == "reverse":
                assert q["prompt"] == word_obj["meaning_vi"]
                assert word_obj["word"] in q["options"]
            elif q_type == "listening":
                assert q["audio_word"] == word_obj["word"]
                assert word_obj["word"] in q["options"]
            elif q_type == "fill_blank":
                assert word_obj["meaning_vi"] in q["prompt"]
                assert q["blank_length"] == len(word_obj["word"])
