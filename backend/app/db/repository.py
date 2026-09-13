import random
import uuid
from datetime import datetime, timezone, date, timedelta
from typing import Dict, List, Optional, Any
from app.core.config import settings
from app.core.sm2 import calculate_sm2
from app.db.data_loader import load_toeic_data

try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None


def ensure_valid_uuid(uid: str) -> str:
    if not uid:
        return "00000000-0000-0000-0000-000000000001"
    try:
        return str(uuid.UUID(str(uid)))
    except (ValueError, AttributeError):
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(uid)))


class BaseRepository:
    def __init__(self):
        self.raw_data = load_toeic_data()
        self._init_static_data()

    def _init_static_data(self):
        self.lessons_data = []
        self.words_data = []
        self.words_by_id = {}
        self.words_by_lesson = {}

        word_counter = 1
        for lesson_idx, l in enumerate(self.raw_data.get("lessons", []), start=1):
            lesson_num = int(l.get("lesson_number", lesson_idx))
            lesson_id = lesson_num  # 1..50
            lesson_obj = {
                "id": lesson_id,
                "lesson_number": lesson_num,
                "title_en": l.get("title_en", "").strip(),
                "title_vi": l.get("title_vi", "").strip(),
            }
            self.lessons_data.append(lesson_obj)
            self.words_by_lesson[lesson_id] = []

            for w in l.get("words", []):
                w_obj = {
                    "id": word_counter,
                    "lesson_id": lesson_id,
                    "word": w.get("word", "").strip(),
                    "part_of_speech": (w.get("part_of_speech") or "").strip(),
                    "definition_en": (w.get("definition") or "").strip(),
                    "related_forms": (w.get("related_forms") or "").strip(),
                    "meaning_vi": (w.get("meaning_vi") or "").strip(),
                    "audio_url": None,
                    "audio_url_uk": None,
                }
                self.words_data.append(w_obj)
                self.words_by_id[word_counter] = w_obj
                self.words_by_lesson[lesson_id].append(w_obj)
                word_counter += 1


class MockRepository(BaseRepository):
    def __init__(self):
        super().__init__()
        # In-memory storage per user
        # user_id -> dict
        self.user_states: Dict[str, dict] = {}
        # (user_id, word_id) -> dict
        self.user_word_progress: Dict[tuple, dict] = {}
        # user_id -> list of test_sessions
        self.test_sessions: Dict[str, dict] = {}
        # session_id -> list of test_answers
        self.test_answers: Dict[str, list] = {}

    def _get_or_create_user_state(self, user_id: str, display_name: str = "") -> dict:
        if user_id not in self.user_states:
            first_lesson_id = self.lessons_data[0]["id"] if self.lessons_data else 1
            self.user_states[user_id] = {
                "user_id": user_id,
                "display_name": display_name or "User",
                "current_lesson_id": first_lesson_id,
                "current_word_index": 0,
                "current_mode": "learn",
                "last_active_at": datetime.now(timezone.utc),
                "streak_days": 1,
                "last_streak_date": date.today(),
                "total_study_seconds": 0,
            }
        return self.user_states[user_id]

    def _update_streak(self, user_id: str):
        state = self._get_or_create_user_state(user_id)
        today = date.today()
        last_date = state.get("last_streak_date")
        if last_date is None:
            state["streak_days"] = 1
            state["last_streak_date"] = today
        elif last_date == today:
            pass  # already counted for today
        elif last_date == today - timedelta(days=1):
            state["streak_days"] += 1
            state["last_streak_date"] = today
        else:
            state["streak_days"] = 1
            state["last_streak_date"] = today
        state["last_active_at"] = datetime.now(timezone.utc)

    def get_user_state(self, user_id: str, display_name: str = "") -> dict:
        state = self._get_or_create_user_state(user_id, display_name)
        now = datetime.now(timezone.utc)

        # Compute summary
        total_words = len(self.words_data)
        learned_count = 0
        mastered_count = 0
        learning_count = 0
        due_count = 0
        word_progress_map = {}

        # Scan progress for this user
        for (u_id, w_id), p in self.user_word_progress.items():
            if u_id != user_id:
                continue
            st = p.get("status", "new")
            if st == "learning":
                learning_count += 1
            elif st == "learned":
                learned_count += 1
            elif st == "mastered":
                mastered_count += 1

            due = p.get("due_date")
            if due and due <= now and st in ("learning", "learned", "mastered"):
                due_count += 1

            word_progress_map[str(w_id)] = {
                "word_id": w_id,
                "status": st,
                "ease_factor": p.get("ease_factor", 2.5),
                "interval_days": p.get("interval_days", 0.0),
                "repetitions": p.get("repetitions", 0),
                "due_date": p.get("due_date").isoformat() if p.get("due_date") else "",
                "is_marked_known": p.get("is_marked_known", False),
                "correct_count": p.get("correct_count", 0),
                "wrong_count": p.get("wrong_count", 0),
            }

        new_count = total_words - (learning_count + learned_count + mastered_count)
        overall_pct = int(round(((learned_count + mastered_count) / total_words) * 100)) if total_words > 0 else 0

        # Lessons progress
        lessons_progress = []
        for l in self.lessons_data:
            l_id = l["id"]
            l_words = self.words_by_lesson.get(l_id, [])
            total_l = len(l_words)
            l_learned = 0
            l_mastered = 0
            for w in l_words:
                prog = self.user_word_progress.get((user_id, w["id"]))
                if prog:
                    if prog.get("status") == "mastered":
                        l_mastered += 1
                        l_learned += 1
                    elif prog.get("status") == "learned":
                        l_learned += 1

            is_completed = (l_learned >= total_l and total_l > 0)
            pct = int(round((l_learned / total_l) * 100)) if total_l > 0 else 0
            lessons_progress.append({
                "lesson_id": l_id,
                "lesson_number": l["lesson_number"],
                "words_total": total_l,
                "words_learned": l_learned,
                "words_mastered": l_mastered,
                "is_completed": is_completed,
                "progress_percent": pct,
            })

        # Match current lesson number
        current_l_id = state.get("current_lesson_id", 1)
        current_l_num = 1
        for l in self.lessons_data:
            if l["id"] == current_l_id:
                current_l_num = l["lesson_number"]
                break

        return {
            "user_id": user_id,
            "display_name": state.get("display_name", "User"),
            "current_lesson_id": current_l_id,
            "current_lesson_number": current_l_num,
            "current_word_index": state.get("current_word_index", 0),
            "current_mode": state.get("current_mode", "learn"),
            "streak_days": state.get("streak_days", 0),
            "last_streak_date": state.get("last_streak_date"),
            "total_study_seconds": state.get("total_study_seconds", 0),
            "summary": {
                "total_words": total_words,
                "words_learned": learned_count,
                "words_mastered": mastered_count,
                "words_learning": learning_count,
                "words_new": max(0, new_count),
                "overall_progress_percent": overall_pct,
                "due_reviews_count": due_count,
            },
            "lessons_progress": lessons_progress,
            "word_progress_map": word_progress_map,
        }

    def update_user_state(
        self,
        user_id: str,
        current_lesson_id: Optional[int] = None,
        current_word_index: Optional[int] = None,
        current_mode: Optional[str] = None,
        add_study_seconds: int = 0,
    ) -> dict:
        state = self._get_or_create_user_state(user_id)
        if current_lesson_id is not None:
            state["current_lesson_id"] = current_lesson_id
        if current_word_index is not None:
            state["current_word_index"] = max(0, current_word_index)
        if current_mode is not None:
            state["current_mode"] = current_mode
        if add_study_seconds > 0:
            state["total_study_seconds"] = state.get("total_study_seconds", 0) + add_study_seconds

        self._update_streak(user_id)
        return self.get_user_state(user_id)

    def get_lessons(self, user_id: str) -> List[dict]:
        state_data = self.get_user_state(user_id)
        prog_by_lesson = {p["lesson_id"]: p for p in state_data["lessons_progress"]}

        results = []
        for l in self.lessons_data:
            l_id = l["id"]
            p = prog_by_lesson.get(l_id, {
                "words_total": len(self.words_by_lesson.get(l_id, [])),
                "words_learned": 0,
                "words_mastered": 0,
                "is_completed": False,
                "progress_percent": 0,
            })
            results.append({
                "id": l_id,
                "lesson_number": l["lesson_number"],
                "title_en": l["title_en"],
                "title_vi": l["title_vi"],
                "progress": p,
            })
        return results

    def get_lesson_words(self, lesson_id: int, user_id: str) -> dict:
        lesson = next((l for l in self.lessons_data if l["id"] == lesson_id), None)
        if not lesson:
            return None

        raw_words = self.words_by_lesson.get(lesson_id, [])
        words_res = []
        learned_count = 0
        mastered_count = 0

        for w in raw_words:
            p = self.user_word_progress.get((user_id, w["id"]))
            if p:
                st = p.get("status", "new")
                if st == "mastered":
                    mastered_count += 1
                    learned_count += 1
                elif st == "learned":
                    learned_count += 1

                words_res.append({
                    **w,
                    "status": st,
                    "ease_factor": p.get("ease_factor", 2.5),
                    "interval_days": p.get("interval_days", 0.0),
                    "repetitions": p.get("repetitions", 0),
                    "due_date": p.get("due_date").isoformat() if p.get("due_date") else None,
                    "is_marked_known": p.get("is_marked_known", False),
                    "correct_count": p.get("correct_count", 0),
                    "wrong_count": p.get("wrong_count", 0),
                })
            else:
                words_res.append({
                    **w,
                    "status": "new",
                    "ease_factor": 2.5,
                    "interval_days": 0.0,
                    "repetitions": 0,
                    "due_date": None,
                    "is_marked_known": False,
                    "correct_count": 0,
                    "wrong_count": 0,
                })

        total_words = len(raw_words)
        progress = {
            "words_total": total_words,
            "words_learned": learned_count,
            "words_mastered": mastered_count,
            "is_completed": (learned_count >= total_words and total_words > 0),
            "progress_percent": int(round((learned_count / total_words) * 100)) if total_words > 0 else 0,
        }

        return {
            "id": lesson["id"],
            "lesson_number": lesson["lesson_number"],
            "title_en": lesson["title_en"],
            "title_vi": lesson["title_vi"],
            "progress": progress,
            "words": words_res,
        }

    def get_word(self, word_id: int, user_id: str) -> Optional[dict]:
        w = self.words_by_id.get(word_id)
        if not w:
            return None
        p = self.user_word_progress.get((user_id, word_id), {})
        return {
            **w,
            "status": p.get("status", "new"),
            "ease_factor": p.get("ease_factor", 2.5),
            "interval_days": p.get("interval_days", 0.0),
            "repetitions": p.get("repetitions", 0),
            "due_date": p.get("due_date").isoformat() if p.get("due_date") else None,
            "is_marked_known": p.get("is_marked_known", False),
            "correct_count": p.get("correct_count", 0),
            "wrong_count": p.get("wrong_count", 0),
        }

    def mark_word_known(self, user_id: str, word_id: int, is_marked_known: bool) -> dict:
        w = self.words_by_id.get(word_id)
        if not w:
            raise ValueError("Word not found")

        key = (user_id, word_id)
        p = self.user_word_progress.get(key, {
            "status": "new",
            "ease_factor": 2.5,
            "interval_days": 0.0,
            "repetitions": 0,
            "due_date": datetime.now(timezone.utc),
            "correct_count": 0,
            "wrong_count": 0,
            "is_marked_known": False,
        })

        p["is_marked_known"] = is_marked_known
        if is_marked_known:
            if p.get("status") in ("new", "learning"):
                p["status"] = "learned"
                if p.get("interval_days", 0) == 0:
                    p["interval_days"] = 1.0
                    p["due_date"] = datetime.now(timezone.utc) + timedelta(days=1)
        else:
            if p.get("repetitions", 0) == 0:
                p["status"] = "new"

        p["updated_at"] = datetime.now(timezone.utc)
        self.user_word_progress[key] = p
        self._update_streak(user_id)

        return {
            "word_id": word_id,
            "status": p["status"],
            "ease_factor": p["ease_factor"],
            "interval_days": p["interval_days"],
            "repetitions": p["repetitions"],
            "due_date": p["due_date"],
            "correct_count": p["correct_count"],
            "wrong_count": p["wrong_count"],
            "is_marked_known": p["is_marked_known"],
            "last_reviewed_at": p.get("last_reviewed_at"),
        }

    def review_word(self, user_id: str, word_id: int, rating: str) -> dict:
        w = self.words_by_id.get(word_id)
        if not w:
            raise ValueError("Word not found")

        key = (user_id, word_id)
        current = self.user_word_progress.get(key, {})

        sm2_res = calculate_sm2(
            rating=rating,
            repetitions=current.get("repetitions", 0),
            interval_days=current.get("interval_days", 0.0),
            ease_factor=current.get("ease_factor", 2.5),
            correct_count=current.get("correct_count", 0),
            wrong_count=current.get("wrong_count", 0),
            current_status=current.get("status", "new"),
            is_marked_known=current.get("is_marked_known", False),
        )

        updated = {
            **current,
            **sm2_res,
            "is_marked_known": current.get("is_marked_known", False) or (sm2_res["status"] in ("learned", "mastered")),
            "updated_at": datetime.now(timezone.utc),
        }
        self.user_word_progress[key] = updated
        self._update_streak(user_id)

        return {
            "word_id": word_id,
            "status": updated["status"],
            "ease_factor": updated["ease_factor"],
            "interval_days": updated["interval_days"],
            "repetitions": updated["repetitions"],
            "due_date": updated["due_date"],
            "correct_count": updated["correct_count"],
            "wrong_count": updated["wrong_count"],
            "is_marked_known": updated["is_marked_known"],
            "last_reviewed_at": updated["last_reviewed_at"],
        }

    def get_due_reviews(self, user_id: str) -> List[dict]:
        now = datetime.now(timezone.utc)
        due_items = []

        for (u_id, w_id), p in self.user_word_progress.items():
            if u_id != user_id:
                continue
            due_d = p.get("due_date")
            st = p.get("status", "new")
            if due_d and due_d <= now and st in ("learning", "learned", "mastered"):
                w = self.words_by_id.get(w_id)
                if w:
                    due_items.append({
                        **w,
                        "status": st,
                        "ease_factor": p.get("ease_factor", 2.5),
                        "interval_days": p.get("interval_days", 0.0),
                        "repetitions": p.get("repetitions", 0),
                        "due_date": due_d.isoformat(),
                        "is_marked_known": p.get("is_marked_known", False),
                        "correct_count": p.get("correct_count", 0),
                        "wrong_count": p.get("wrong_count", 0),
                        "_due_timestamp": due_d.timestamp(),
                    })

        # Sort overdue longest first (ascending timestamp)
        due_items.sort(key=lambda x: x["_due_timestamp"])
        for item in due_items:
            item.pop("_due_timestamp", None)
        return due_items

    def update_word_audio(self, word_id: int, audio_url: str, audio_url_uk: Optional[str] = None):
        w = self.words_by_id.get(word_id)
        if w:
            w["audio_url"] = audio_url
            if audio_url_uk:
                w["audio_url_uk"] = audio_url_uk
        return w

    def get_all_words(
        self,
        user_id: str,
        lesson_id: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 600,
        offset: int = 0,
    ) -> dict:
        target_lesson_ids = None
        if lesson_id is not None:
            matching_l = next((l for l in self.lessons_data if l["id"] == lesson_id or l.get("lesson_number") == lesson_id), None)
            if matching_l:
                target_lesson_ids = {matching_l["id"], matching_l.get("lesson_number")}
            else:
                target_lesson_ids = {lesson_id}

        matched = []
        search_lower = (search or "").strip().lower()

        for w in self.words_data:
            if target_lesson_ids is not None and w["lesson_id"] not in target_lesson_ids:
                continue

            if search_lower:
                if (
                    search_lower not in w["word"].lower()
                    and search_lower not in (w.get("meaning_vi") or "").lower()
                    and search_lower not in (w.get("definition_en") or "").lower()
                ):
                    continue

            p = self.user_word_progress.get((user_id, w["id"]), {})
            w_status = p.get("status", "new")
            if status and w_status != status:
                continue

            matched.append({
                **w,
                "status": w_status,
                "ease_factor": p.get("ease_factor", 2.5),
                "interval_days": p.get("interval_days", 0.0),
                "repetitions": p.get("repetitions", 0),
                "due_date": p.get("due_date").isoformat() if p.get("due_date") else None,
                "is_marked_known": p.get("is_marked_known", False),
                "correct_count": p.get("correct_count", 0),
                "wrong_count": p.get("wrong_count", 0),
            })

        total = len(matched)
        paginated = matched[offset : offset + limit]
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "words": paginated,
        }

    def batch_mark_words(self, user_id: str, word_ids: List[int], is_marked_known: bool) -> int:
        count = 0
        for wid in word_ids:
            try:
                self.mark_word_known(user_id, wid, is_marked_known)
                count += 1
            except ValueError:
                pass
        return count

    # Quiz / Test creation and evaluation
    def create_test(
        self,
        user_id: str,
        scope: str = "lesson",
        lesson_ids: Optional[List[int]] = None,
        test_type: str = "mixed",
        question_count: int = 10,
    ) -> dict:
        pool: List[dict] = []
        if scope == "lesson" and lesson_ids:
            pool = [w for w in self.words_data if w["lesson_id"] in lesson_ids]
        elif scope == "multi_lesson" and lesson_ids:
            pool = [w for w in self.words_data if w["lesson_id"] in lesson_ids]
        elif scope == "learning_only":
            learning_wids = {
                w_id for (u_id, w_id), p in self.user_word_progress.items()
                if u_id == user_id and p.get("status") in ("learning", "learned")
            }
            pool = [w for w in self.words_data if w["id"] in learning_wids]
            if len(pool) < question_count:
                # Fill up with other words
                extra = [w for w in self.words_data if w["id"] not in learning_wids]
                pool.extend(random.sample(extra, min(len(extra), question_count - len(pool))))
        else:  # "all" or fallback
            pool = list(self.words_data)

        if not pool:
            pool = list(self.words_data)

        sample_size = min(len(pool), max(1, question_count))
        selected_words = random.sample(pool, sample_size)

        available_types = ["multiple_choice", "reverse", "listening", "fill_blank"]
        session_id = str(uuid.uuid4())
        questions = []
        session_questions_internal = []

        all_meanings = [w["meaning_vi"] for w in self.words_data if w.get("meaning_vi")]
        all_words = [w["word"] for w in self.words_data if w.get("word")]

        for idx, w in enumerate(selected_words):
            if test_type == "mixed":
                q_type = random.choice(available_types)
            else:
                q_type = test_type

            # Distractors
            options = []
            options_detail = []
            prompt = ""
            hint = None
            blank_length = None

            if q_type == "multiple_choice":
                # Prompt: English word -> Options: Vietnamese meanings
                prompt = w["word"]
                correct = w["meaning_vi"]
                distractor_words = random.sample(
                    [other for other in self.words_data if other["id"] != w["id"] and other.get("meaning_vi") != correct],
                    min(3, len(self.words_data) - 1),
                )
                chosen = distractor_words + [w]
                random.shuffle(chosen)
                options = [cw["meaning_vi"] for cw in chosen]
                options_detail = [
                    {
                        "text": cw["meaning_vi"],
                        "word": cw["word"],
                        "part_of_speech": cw.get("part_of_speech"),
                        "meaning_vi": cw["meaning_vi"],
                        "definition_en": cw.get("definition_en"),
                    }
                    for cw in chosen
                ]
            elif q_type in ("reverse", "listening"):
                prompt = w["meaning_vi"] if q_type == "reverse" else "Nghe và chọn từ đúng:"
                correct = w["word"]
                distractor_words = random.sample(
                    [other for other in self.words_data if other["id"] != w["id"] and other["word"].lower() != correct.lower()],
                    min(3, len(self.words_data) - 1),
                )
                chosen = distractor_words + [w]
                random.shuffle(chosen)
                options = [cw["word"] for cw in chosen]
                options_detail = [
                    {
                        "text": cw["word"],
                        "word": cw["word"],
                        "part_of_speech": cw.get("part_of_speech"),
                        "meaning_vi": cw["meaning_vi"],
                        "definition_en": cw.get("definition_en"),
                    }
                    for cw in chosen
                ]
            elif q_type == "fill_blank":
                # Fill in the blank: Vietnamese meaning + word length
                prompt = f"Nghĩa: {w['meaning_vi']} (Từ bắt đầu bằng chữ '{w['word'][0]}')"
                correct = w["word"]
                blank_length = len(w["word"])
                hint = f"{w['word'][0]}{'_' * (len(w['word']) - 1)}"
                options = None
                options_detail = None
            else:
                prompt = w["word"]
                correct = w["meaning_vi"]
                options = [w["meaning_vi"]]
                options_detail = [
                    {
                        "text": w["meaning_vi"],
                        "word": w["word"],
                        "part_of_speech": w.get("part_of_speech"),
                        "meaning_vi": w["meaning_vi"],
                        "definition_en": w.get("definition_en"),
                    }
                ]

            # Question payload for user (does NOT disclose the correct answer)
            q_payload = {
                "question_index": idx,
                "word_id": w["id"],
                "question_type": q_type,
                "prompt": prompt,
                "audio_url": w.get("audio_url"),
                "audio_word": w["word"] if q_type == "listening" else None,
                "audio_word_id": w["id"],
                "options": options if options else None,
                "options_detail": options_detail if options_detail else None,
                "blank_length": blank_length,
                "hint": hint,
            }
            questions.append(q_payload)

            # Store internal for verification
            session_questions_internal.append({
                "word_id": w["id"],
                "word": w["word"],
                "meaning_vi": w["meaning_vi"],
                "question_type": q_type,
                "correct_answer": correct,
            })

        # Save session in mock store
        self.test_sessions[session_id] = {
            "id": session_id,
            "user_id": user_id,
            "test_type": test_type,
            "total_questions": len(questions),
            "questions_internal": session_questions_internal,
            "started_at": datetime.now(timezone.utc),
            "finished_at": None,
            "score_percent": 0.0,
            "correct_answers": 0,
        }

        return {
            "id": session_id,
            "test_type": test_type,
            "total_questions": len(questions),
            "questions": questions,
        }

    def submit_test(self, user_id: str, test_id: str, answers: List[dict]) -> dict:
        session = self.test_sessions.get(test_id)
        now = datetime.now(timezone.utc)

        if not session or session.get("user_id") != user_id:
            # Reconstruct session if missing or created in another instance
            session = {
                "id": test_id,
                "user_id": user_id,
                "test_type": "mixed",
                "total_questions": len(answers),
                "questions_internal": [],
                "started_at": now,
                "finished_at": None,
                "score_percent": 0.0,
                "correct_answers": 0,
            }
            for a in answers:
                wid = a["word_id"]
                w = self.words_by_id.get(wid)
                if not w:
                    continue
                q_type = a.get("question_type") or "multiple_choice"
                if q_type == "multiple_choice":
                    correct_ans = w["meaning_vi"]
                else:
                    correct_ans = w["word"]
                session["questions_internal"].append({
                    "word_id": wid,
                    "word": w["word"],
                    "meaning_vi": w["meaning_vi"],
                    "question_type": q_type,
                    "correct_answer": correct_ans,
                })
            self.test_sessions[test_id] = session

        user_answer_map = {a["word_id"]: str(a.get("user_answer", "")).strip() for a in answers}

        results = []
        correct_count = 0
        total = len(session["questions_internal"])

        for q in session["questions_internal"]:
            wid = q["word_id"]
            u_ans = user_answer_map.get(wid, "").strip()
            correct_ans = q["correct_answer"].strip()

            is_correct = (u_ans.lower() == correct_ans.lower())
            if not is_correct and q["word"].lower() == u_ans.lower():
                is_correct = True
            elif not is_correct and q["meaning_vi"].lower() == u_ans.lower():
                is_correct = True

            if is_correct:
                correct_count += 1
            else:
                # Wrong answer: penalize in user_word_progress (bring due_date to now, increase wrong_count)
                p = self.user_word_progress.get((user_id, wid))
                if p:
                    p["wrong_count"] = p.get("wrong_count", 0) + 1
                    p["due_date"] = now  # Needs immediate review
                    p["updated_at"] = now
                else:
                    self.user_word_progress[(user_id, wid)] = {
                        "status": "learning",
                        "ease_factor": 2.3,
                        "interval_days": 1.0,
                        "repetitions": 0,
                        "due_date": now,
                        "correct_count": 0,
                        "wrong_count": 1,
                        "is_marked_known": False,
                        "updated_at": now,
                    }

            w_obj = self.words_by_id.get(wid, {})
            results.append({
                "word_id": wid,
                "word": q["word"],
                "meaning_vi": q["meaning_vi"],
                "part_of_speech": w_obj.get("part_of_speech"),
                "definition_en": w_obj.get("definition_en"),
                "question_type": q["question_type"],
                "user_answer": u_ans,
                "correct_answer": correct_ans,
                "is_correct": is_correct,
            })

        score_percent = round((correct_count / total) * 100, 1) if total > 0 else 0.0
        session["finished_at"] = now
        session["correct_answers"] = correct_count
        session["score_percent"] = score_percent

        self.test_answers[test_id] = results
        self._update_streak(user_id)

        return {
            "id": test_id,
            "test_type": session["test_type"],
            "total_questions": total,
            "correct_answers": correct_count,
            "score_percent": score_percent,
            "results": results,
            "started_at": session["started_at"],
            "finished_at": now,
        }

    def get_test_history(self, user_id: str) -> List[dict]:
        user_tests = [
            s for s in self.test_sessions.values()
            if s["user_id"] == user_id and s["finished_at"] is not None
        ]
        user_tests.sort(key=lambda s: s["started_at"], reverse=True)
        return [
            {
                "id": s["id"],
                "test_type": s["test_type"],
                "total_questions": s["total_questions"],
                "correct_answers": s["correct_answers"],
                "score_percent": s["score_percent"],
                "started_at": s["started_at"],
                "finished_at": s["finished_at"],
            }
            for s in user_tests
        ]

    def get_dashboard_summary(self, user_id: str) -> dict:
        state_data = self.get_user_state(user_id)
        summary = state_data["summary"]

        status_breakdown = {
            "new": summary["words_new"],
            "learning": summary["words_learning"],
            "learned": summary["words_learned"],
            "mastered": summary["words_mastered"],
        }

        # Find urgent lessons (lessons with highest due counts or lowest progress)
        urgent_lessons = []
        due_by_lesson = {}
        now = datetime.now(timezone.utc)
        for (u_id, w_id), p in self.user_word_progress.items():
            if u_id != user_id:
                continue
            due_d = p.get("due_date")
            st = p.get("status", "new")
            if due_d and due_d <= now and st in ("learning", "learned", "mastered"):
                w = self.words_by_id.get(w_id)
                if w:
                    lid = w["lesson_id"]
                    due_by_lesson[lid] = due_by_lesson.get(lid, 0) + 1

        for l in self.lessons_data[:10]:
            lid = l["id"]
            due_c = due_by_lesson.get(lid, 0)
            lp = next((p for p in state_data["lessons_progress"] if p["lesson_id"] == lid), None)
            urgent_lessons.append({
                "lesson_id": lid,
                "lesson_number": l["lesson_number"],
                "title_en": l["title_en"],
                "title_vi": l["title_vi"],
                "due_count": due_c,
                "total_words": lp["words_total"] if lp else 12,
                "learned_words": lp["words_learned"] if lp else 0,
            })

        urgent_lessons.sort(key=lambda x: (x["due_count"], -x["learned_words"]), reverse=True)

        return {
            "total_words": summary["total_words"],
            "words_learned_or_mastered": summary["words_learned"] + summary["words_mastered"],
            "overall_progress_percent": summary["overall_progress_percent"],
            "status_breakdown": status_breakdown,
            "streak_days": state_data["streak_days"],
            "total_study_seconds": state_data["total_study_seconds"],
            "due_reviews_count": summary["due_reviews_count"],
            "urgent_lessons": urgent_lessons[:5],
        }

    def get_leaderboard(self, current_user_id: str, sort_by: str = "words_learned", limit: int = 50) -> dict:
        users_map = {}
        self._get_or_create_user_state(current_user_id)

        sample_users = [
            {"user_id": "00000000-0000-0000-0000-0000000000aa", "display_name": "Minh Anh", "words_learned": 180, "words_mastered": 95, "avg_test_score": 92.5, "streak_days": 14, "total_study_seconds": 12400},
            {"user_id": "00000000-0000-0000-0000-0000000000bb", "display_name": "Tuấn Kiệt", "words_learned": 145, "words_mastered": 70, "avg_test_score": 88.0, "streak_days": 9, "total_study_seconds": 9600},
            {"user_id": "00000000-0000-0000-0000-0000000000cc", "display_name": "Lan Phương", "words_learned": 110, "words_mastered": 50, "avg_test_score": 85.5, "streak_days": 6, "total_study_seconds": 7200},
            {"user_id": "00000000-0000-0000-0000-0000000000dd", "display_name": "Hoàng Nam", "words_learned": 85, "words_mastered": 30, "avg_test_score": 80.0, "streak_days": 4, "total_study_seconds": 5400},
        ]
        for su in sample_users:
            users_map[su["user_id"]] = dict(su)

        for u_id, st in self.user_states.items():
            state_data = self.get_user_state(u_id)
            summary = state_data["summary"]
            user_tests = [s for s in self.test_sessions.values() if s.get("user_id") == u_id and s.get("finished_at")]
            avg_score = round(sum(s.get("score_percent", 0.0) for s in user_tests) / len(user_tests), 1) if user_tests else 0.0

            users_map[u_id] = {
                "user_id": u_id,
                "display_name": st.get("display_name", "Học viên"),
                "words_learned": summary["words_learned"] + summary["words_mastered"],
                "words_mastered": summary["words_mastered"],
                "avg_test_score": avg_score,
                "streak_days": state_data.get("streak_days", 0),
                "total_study_seconds": state_data.get("total_study_seconds", 0),
            }

        all_items = list(users_map.values())
        sort_key = sort_by if sort_by in ("words_learned", "words_mastered", "avg_test_score", "streak_days", "total_study_seconds") else "words_learned"
        all_items.sort(key=lambda x: (x.get(sort_key, 0), x.get("words_learned", 0)), reverse=True)

        ranked_items = []
        my_rank_item = None
        for idx, item in enumerate(all_items, start=1):
            is_me = (item["user_id"] == current_user_id)
            leaderboard_item = {
                "rank": idx,
                "user_id": item["user_id"],
                "display_name": item["display_name"],
                "words_learned": item["words_learned"],
                "words_mastered": item["words_mastered"],
                "avg_test_score": item["avg_test_score"],
                "streak_days": item["streak_days"],
                "total_study_seconds": item["total_study_seconds"],
                "is_current_user": is_me,
            }
            ranked_items.append(leaderboard_item)
            if is_me:
                my_rank_item = leaderboard_item

        return {
            "sort_by": sort_key,
            "items": ranked_items[:limit],
            "my_rank": my_rank_item,
        }

    def get_my_leaderboard_rank(self, current_user_id: str, sort_by: str = "words_learned") -> dict:
        data = self.get_leaderboard(current_user_id, sort_by=sort_by, limit=100)
        return data.get("my_rank") or {
            "rank": 1,
            "user_id": current_user_id,
            "display_name": "Bạn",
            "words_learned": 0,
            "words_mastered": 0,
            "avg_test_score": 0.0,
            "streak_days": 0,
            "total_study_seconds": 0,
            "is_current_user": True,
        }


class SupabaseRepository(BaseRepository):
    """
    Connects directly to Supabase via supabase-py client using Service Role Key.
    Provides identical methods to MockRepository, persisting all data to Supabase Postgres.
    """
    def __init__(self, client: Client):
        super().__init__()
        self.supabase = client
        self._mock_states: Dict[str, dict] = {}
        self._mock_progress: Dict[tuple, dict] = {}
        self._mock_sessions: Dict[str, dict] = {}
        self._mock_answers: Dict[str, list] = {}
        self._cached_sessions: Dict[str, dict] = {}
        self._sync_db_metadata()

    def _sync_db_metadata(self):
        try:
            db_lessons = self.supabase.table("lessons").select("*").order("lesson_number").execute()
            if db_lessons.data and len(db_lessons.data) > 0:
                self.lessons_data = db_lessons.data

                db_words = self.supabase.table("words").select("*").order("id").limit(1000).execute()
                if db_words.data and len(db_words.data) > 0:
                    self.words_data = db_words.data
                    self.words_by_id = {w["id"]: w for w in self.words_data}
                    self.words_by_lesson = {}
                    for l in self.lessons_data:
                        self.words_by_lesson[l["id"]] = []
                    for w in self.words_data:
                        lid = w["lesson_id"]
                        if lid not in self.words_by_lesson:
                            self.words_by_lesson[lid] = []
                        self.words_by_lesson[lid].append(w)
        except Exception as e:
            print("⚠️ Could not sync DB metadata:", e)

    def get_user_state(self, user_id: str, display_name: str = "") -> dict:
        user_id = ensure_valid_uuid(user_id)

        # Check user_state in Supabase
        state = None
        try:
            res = self.supabase.table("user_state").select("*").eq("user_id", user_id).execute()
            if res.data:
                state = res.data[0]
        except Exception:
            pass

        if not state:
            if user_id in self._mock_states:
                state = self._mock_states[user_id]
            else:
                first_lesson_id = 1
                try:
                    first_lesson = self.supabase.table("lessons").select("id").order("lesson_number", desc=False).limit(1).execute()
                    if first_lesson and first_lesson.data:
                        first_lesson_id = first_lesson.data[0]["id"]
                except Exception:
                    pass

                new_state = {
                    "user_id": user_id,
                    "current_lesson_id": first_lesson_id,
                    "current_word_index": 0,
                    "current_mode": "learn",
                    "streak_days": 1,
                    "last_streak_date": date.today().isoformat(),
                    "total_study_seconds": 0,
                }
                try:
                    self.supabase.table("user_state").insert(new_state).execute()
                except Exception:
                    self._mock_states[user_id] = new_state
                state = new_state

        # Fetch all user_word_progress for this user safely
        uwp_data = []
        try:
            uwp_res = self.supabase.table("user_word_progress").select("*").eq("user_id", user_id).execute()
            uwp_data = uwp_res.data or []
        except Exception:
            pass

        # Also merge in-memory mock progress if present
        for (u_id, w_id), p in self._mock_progress.items():
            if u_id == user_id and not any(item.get("word_id") == w_id for item in uwp_data):
                uwp_data.append(p)

        now = datetime.now(timezone.utc)

        total_words = len(self.words_data)
        learned_count = 0
        mastered_count = 0
        learning_count = 0
        due_count = 0
        word_progress_map = {}

        for p in uwp_data:
            wid = p["word_id"]
            st = p.get("status", "new")
            if st == "learning":
                learning_count += 1
            elif st == "learned":
                learned_count += 1
            elif st == "mastered":
                mastered_count += 1

            due_str = p.get("due_date")
            if due_str:
                try:
                    due_dt = datetime.fromisoformat(due_str.replace("Z", "+00:00"))
                    if due_dt <= now and st in ("learning", "learned", "mastered"):
                        due_count += 1
                except Exception:
                    pass

            word_progress_map[str(wid)] = {
                "word_id": wid,
                "status": st,
                "ease_factor": float(p.get("ease_factor", 2.5)),
                "interval_days": float(p.get("interval_days", 0.0)),
                "repetitions": int(p.get("repetitions", 0)),
                "due_date": due_str or "",
                "is_marked_known": bool(p.get("is_marked_known", False)),
                "correct_count": int(p.get("correct_count", 0)),
                "wrong_count": int(p.get("wrong_count", 0)),
            }

        new_count = max(0, total_words - (learning_count + learned_count + mastered_count))
        overall_pct = int(round(((learned_count + mastered_count) / total_words) * 100)) if total_words > 0 else 0

        # Lessons progress
        lessons_progress = []
        for l in self.lessons_data:
            l_id = l["id"]
            l_words = self.words_by_lesson.get(l_id, [])
            total_l = len(l_words)
            l_learned = 0
            l_mastered = 0
            for w in l_words:
                prog = word_progress_map.get(str(w["id"]))
                if prog:
                    if prog["status"] == "mastered":
                        l_mastered += 1
                        l_learned += 1
                    elif prog["status"] == "learned":
                        l_learned += 1

            is_completed = (l_learned >= total_l and total_l > 0)
            pct = int(round((l_learned / total_l) * 100)) if total_l > 0 else 0
            lessons_progress.append({
                "lesson_id": l_id,
                "lesson_number": l["lesson_number"],
                "words_total": total_l,
                "words_learned": l_learned,
                "words_mastered": l_mastered,
                "is_completed": is_completed,
                "progress_percent": pct,
            })

        current_l_id = state.get("current_lesson_id") or 1
        current_l_num = 1
        for l in self.lessons_data:
            if l["id"] == current_l_id:
                current_l_num = l["lesson_number"]
                break

        last_streak = None
        if state.get("last_streak_date"):
            try:
                last_streak = date.fromisoformat(str(state["last_streak_date"]))
            except Exception:
                pass

        return {
            "user_id": user_id,
            "display_name": display_name or "User",
            "current_lesson_id": current_l_id,
            "current_lesson_number": current_l_num,
            "current_word_index": state.get("current_word_index", 0),
            "current_mode": state.get("current_mode", "learn"),
            "streak_days": state.get("streak_days", 0),
            "last_streak_date": last_streak,
            "total_study_seconds": state.get("total_study_seconds", 0),
            "summary": {
                "total_words": total_words,
                "words_learned": learned_count,
                "words_mastered": mastered_count,
                "words_learning": learning_count,
                "words_new": new_count,
                "overall_progress_percent": overall_pct,
                "due_reviews_count": due_count,
            },
            "lessons_progress": lessons_progress,
            "word_progress_map": word_progress_map,
        }

    def update_user_state(
        self,
        user_id: str,
        current_lesson_id: Optional[int] = None,
        current_word_index: Optional[int] = None,
        current_mode: Optional[str] = None,
        add_study_seconds: int = 0,
    ) -> dict:
        user_id = ensure_valid_uuid(user_id)
        cur_data = {}
        try:
            cur_res = self.supabase.table("user_state").select("*").eq("user_id", user_id).execute()
            if cur_res.data:
                cur_data = cur_res.data[0]
        except Exception:
            pass

        if not cur_data and user_id in self._mock_states:
            cur_data = self._mock_states[user_id]

        updates: Dict[str, Any] = {
            "last_active_at": datetime.now(timezone.utc).isoformat(),
        }
        if current_lesson_id is not None:
            updates["current_lesson_id"] = current_lesson_id
        if current_word_index is not None:
            updates["current_word_index"] = max(0, current_word_index)
        if current_mode is not None:
            updates["current_mode"] = current_mode
        if add_study_seconds > 0:
            updates["total_study_seconds"] = cur_data.get("total_study_seconds", 0) + add_study_seconds

        # Streak calculation
        today = date.today()
        last_streak_str = cur_data.get("last_streak_date")
        if not last_streak_str:
            updates["streak_days"] = 1
            updates["last_streak_date"] = today.isoformat()
        else:
            try:
                last_streak_date = date.fromisoformat(str(last_streak_str))
                if last_streak_date == today:
                    pass
                elif last_streak_date == today - timedelta(days=1):
                    updates["streak_days"] = (cur_data.get("streak_days") or 0) + 1
                    updates["last_streak_date"] = today.isoformat()
                else:
                    updates["streak_days"] = 1
                    updates["last_streak_date"] = today.isoformat()
            except Exception:
                updates["streak_days"] = 1
                updates["last_streak_date"] = today.isoformat()

        try:
            self.supabase.table("user_state").upsert({"user_id": user_id, **updates}).execute()
        except Exception:
            if user_id not in self._mock_states:
                self._mock_states[user_id] = {
                    "user_id": user_id,
                    "current_lesson_id": 1,
                    "current_word_index": 0,
                    "current_mode": "learn",
                }
            self._mock_states[user_id].update(updates)

        return self.get_user_state(user_id)

    def get_lessons(self, user_id: str) -> List[dict]:
        user_id = ensure_valid_uuid(user_id)
        state_data = self.get_user_state(user_id)
        prog_by_lesson = {p["lesson_id"]: p for p in state_data["lessons_progress"]}

        results = []
        for l in self.lessons_data:
            l_id = l["id"]
            p = prog_by_lesson.get(l_id, {
                "words_total": len(self.words_by_lesson.get(l_id, [])),
                "words_learned": 0,
                "words_mastered": 0,
                "is_completed": False,
                "progress_percent": 0,
            })
            results.append({
                "id": l_id,
                "lesson_number": l["lesson_number"],
                "title_en": l["title_en"],
                "title_vi": l["title_vi"],
                "progress": p,
            })
        return results

    def get_lesson_words(self, lesson_id: int, user_id: str) -> dict:
        user_id = ensure_valid_uuid(user_id)
        lesson = next((l for l in self.lessons_data if l["id"] == lesson_id or l["lesson_number"] == lesson_id), None)
        if not lesson:
            return None

        # Fetch progress from DB
        raw_words = self.words_by_lesson.get(lesson["id"], [])
        wids = [w["id"] for w in raw_words]

        uwp_map = {}
        try:
            uwp_res = self.supabase.table("user_word_progress").select("*").eq("user_id", user_id).in_("word_id", wids).execute()
            uwp_map = {p["word_id"]: p for p in (uwp_res.data or [])}
        except Exception:
            pass

        # Merge mock progress
        for wid in wids:
            if wid not in uwp_map and (user_id, wid) in self._mock_progress:
                uwp_map[wid] = self._mock_progress[(user_id, wid)]

        words_res = []
        learned_count = 0
        mastered_count = 0

        for w in raw_words:
            p = uwp_map.get(w["id"])
            if p:
                st = p.get("status", "new")
                if st == "mastered":
                    mastered_count += 1
                    learned_count += 1
                elif st == "learned":
                    learned_count += 1

                words_res.append({
                    **w,
                    "status": st,
                    "ease_factor": float(p.get("ease_factor", 2.5)),
                    "interval_days": float(p.get("interval_days", 0.0)),
                    "repetitions": int(p.get("repetitions", 0)),
                    "due_date": p.get("due_date"),
                    "is_marked_known": bool(p.get("is_marked_known", False)),
                    "correct_count": int(p.get("correct_count", 0)),
                    "wrong_count": int(p.get("wrong_count", 0)),
                })
            else:
                words_res.append({
                    **w,
                    "status": "new",
                    "ease_factor": 2.5,
                    "interval_days": 0.0,
                    "repetitions": 0,
                    "due_date": None,
                    "is_marked_known": False,
                    "correct_count": 0,
                    "wrong_count": 0,
                })

        total_words = len(raw_words)
        progress = {
            "words_total": total_words,
            "words_learned": learned_count,
            "words_mastered": mastered_count,
            "is_completed": (learned_count >= total_words and total_words > 0),
            "progress_percent": int(round((learned_count / total_words) * 100)) if total_words > 0 else 0,
        }

        return {
            "id": lesson["id"],
            "lesson_number": lesson["lesson_number"],
            "title_en": lesson["title_en"],
            "title_vi": lesson["title_vi"],
            "progress": progress,
            "words": words_res,
        }

    def get_word(self, word_id: int, user_id: str) -> Optional[dict]:
        user_id = ensure_valid_uuid(user_id)
        w = self.words_by_id.get(word_id)
        if not w:
            return None
        p = {}
        try:
            res = self.supabase.table("user_word_progress").select("*").eq("user_id", user_id).eq("word_id", word_id).execute()
            if res.data:
                p = res.data[0]
        except Exception:
            pass

        if not p and (user_id, word_id) in self._mock_progress:
            p = self._mock_progress[(user_id, word_id)]

        return {
            **w,
            "status": p.get("status", "new"),
            "ease_factor": float(p.get("ease_factor", 2.5)),
            "interval_days": float(p.get("interval_days", 0.0)),
            "repetitions": int(p.get("repetitions", 0)),
            "due_date": p.get("due_date"),
            "is_marked_known": bool(p.get("is_marked_known", False)),
            "correct_count": int(p.get("correct_count", 0)),
            "wrong_count": int(p.get("wrong_count", 0)),
        }

    def mark_word_known(self, user_id: str, word_id: int, is_marked_known: bool) -> dict:
        user_id = ensure_valid_uuid(user_id)
        w = self.words_by_id.get(word_id)
        if not w:
            raise ValueError("Word not found")

        p = {}
        try:
            res = self.supabase.table("user_word_progress").select("*").eq("user_id", user_id).eq("word_id", word_id).execute()
            if res.data:
                p = res.data[0]
        except Exception:
            pass

        if not p and (user_id, word_id) in self._mock_progress:
            p = self._mock_progress[(user_id, word_id)]

        now = datetime.now(timezone.utc)
        status = p.get("status", "new")
        interval_days = float(p.get("interval_days", 0.0))
        due_date = p.get("due_date") or now.isoformat()

        if is_marked_known:
            if status in ("new", "learning"):
                status = "learned"
                if interval_days == 0:
                    interval_days = 1.0
                    due_date = (now + timedelta(days=1)).isoformat()
        else:
            if int(p.get("repetitions", 0)) == 0:
                status = "new"

        payload = {
            "user_id": user_id,
            "word_id": word_id,
            "status": status,
            "ease_factor": float(p.get("ease_factor", 2.5)),
            "interval_days": interval_days,
            "repetitions": int(p.get("repetitions", 0)),
            "due_date": due_date,
            "is_marked_known": is_marked_known,
            "correct_count": int(p.get("correct_count", 0)),
            "wrong_count": int(p.get("wrong_count", 0)),
            "updated_at": now.isoformat(),
        }

        try:
            self.supabase.table("user_word_progress").upsert(payload, on_conflict="user_id,word_id").execute()
        except Exception:
            self._mock_progress[(user_id, word_id)] = payload

        self.update_user_state(user_id)

        due_date_parsed = now
        try:
            due_date_parsed = datetime.fromisoformat(payload["due_date"].replace("Z", "+00:00"))
        except Exception:
            pass

        return {
            "word_id": word_id,
            "status": payload["status"],
            "ease_factor": payload["ease_factor"],
            "interval_days": payload["interval_days"],
            "repetitions": payload["repetitions"],
            "due_date": due_date_parsed,
            "correct_count": payload["correct_count"],
            "wrong_count": payload["wrong_count"],
            "is_marked_known": payload["is_marked_known"],
            "last_reviewed_at": p.get("last_reviewed_at"),
        }

    def review_word(self, user_id: str, word_id: int, rating: str) -> dict:
        user_id = ensure_valid_uuid(user_id)
        w = self.words_by_id.get(word_id)
        if not w:
            raise ValueError("Word not found")

        current = {}
        try:
            res = self.supabase.table("user_word_progress").select("*").eq("user_id", user_id).eq("word_id", word_id).execute()
            if res.data:
                current = res.data[0]
        except Exception:
            pass

        if not current and (user_id, word_id) in self._mock_progress:
            current = self._mock_progress[(user_id, word_id)]

        sm2_res = calculate_sm2(
            rating=rating,
            repetitions=int(current.get("repetitions", 0)),
            interval_days=float(current.get("interval_days", 0.0)),
            ease_factor=float(current.get("ease_factor", 2.5)),
            correct_count=int(current.get("correct_count", 0)),
            wrong_count=int(current.get("wrong_count", 0)),
            current_status=current.get("status", "new"),
            is_marked_known=bool(current.get("is_marked_known", False)),
        )

        payload = {
            "user_id": user_id,
            "word_id": word_id,
            "status": sm2_res["status"],
            "ease_factor": sm2_res["ease_factor"],
            "interval_days": sm2_res["interval_days"],
            "repetitions": sm2_res["repetitions"],
            "due_date": sm2_res["due_date"].isoformat(),
            "correct_count": sm2_res["correct_count"],
            "wrong_count": sm2_res["wrong_count"],
            "is_marked_known": current.get("is_marked_known", False) or (sm2_res["status"] in ("learned", "mastered")),
            "last_reviewed_at": sm2_res["last_reviewed_at"].isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            self.supabase.table("user_word_progress").upsert(payload, on_conflict="user_id,word_id").execute()
        except Exception:
            self._mock_progress[(user_id, word_id)] = payload

        self.update_user_state(user_id)

        return {
            "word_id": word_id,
            "status": payload["status"],
            "ease_factor": payload["ease_factor"],
            "interval_days": payload["interval_days"],
            "repetitions": payload["repetitions"],
            "due_date": sm2_res["due_date"],
            "correct_count": payload["correct_count"],
            "wrong_count": payload["wrong_count"],
            "is_marked_known": payload["is_marked_known"],
            "last_reviewed_at": sm2_res["last_reviewed_at"],
        }

    def get_due_reviews(self, user_id: str) -> List[dict]:
        now = datetime.now(timezone.utc).isoformat()
        res = (
            self.supabase.table("user_word_progress")
            .select("*")
            .eq("user_id", user_id)
            .lte("due_date", now)
            .in_("status", ["learning", "learned", "mastered"])
            .order("due_date", desc=False)
            .execute()
        )

        due_items = []
        for p in (res.data or []):
            w = self.words_by_id.get(p["word_id"])
            if w:
                due_items.append({
                    **w,
                    "status": p["status"],
                    "ease_factor": float(p.get("ease_factor", 2.5)),
                    "interval_days": float(p.get("interval_days", 0.0)),
                    "repetitions": int(p.get("repetitions", 0)),
                    "due_date": p.get("due_date"),
                    "is_marked_known": bool(p.get("is_marked_known", False)),
                    "correct_count": int(p.get("correct_count", 0)),
                    "wrong_count": int(p.get("wrong_count", 0)),
                })
        return due_items

    def update_word_audio(self, word_id: int, audio_url: str, audio_url_uk: Optional[str] = None):
        w = self.words_by_id.get(word_id)
        if w:
            w["audio_url"] = audio_url
            if audio_url_uk:
                w["audio_url_uk"] = audio_url_uk

        payload = {"audio_url": audio_url}
        if audio_url_uk:
            payload["audio_url_uk"] = audio_url_uk
        try:
            self.supabase.table("words").update(payload).eq("id", word_id).execute()
        except Exception:
            pass
        return w

    def get_all_words(
        self,
        user_id: str,
        lesson_id: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 600,
        offset: int = 0,
    ) -> dict:
        user_id = ensure_valid_uuid(user_id)

        # Fast direct query for user word progress instead of heavy full-state computation
        prog_map = {}
        try:
            res = self.supabase.table("user_word_progress").select("word_id, status, ease_factor, interval_days, repetitions, due_date, is_marked_known, correct_count, wrong_count").eq("user_id", user_id).execute()
            for p in (res.data or []):
                prog_map[str(p["word_id"])] = {
                    "word_id": p["word_id"],
                    "status": p.get("status", "new"),
                    "ease_factor": float(p.get("ease_factor", 2.5)),
                    "interval_days": float(p.get("interval_days", 0.0)),
                    "repetitions": int(p.get("repetitions", 0)),
                    "due_date": p.get("due_date"),
                    "is_marked_known": bool(p.get("is_marked_known", False)),
                    "correct_count": int(p.get("correct_count", 0)),
                    "wrong_count": int(p.get("wrong_count", 0)),
                }
        except Exception as e:
            print(f"⚠️ Query user_word_progress in get_all_words: {e}")

        # Merge mock progress if present
        for (u_id, wid), p in self._mock_progress.items():
            if u_id == user_id and str(wid) not in prog_map:
                prog_map[str(wid)] = {
                    "word_id": wid,
                    "status": p.get("status", "new"),
                    "ease_factor": float(p.get("ease_factor", 2.5)),
                    "interval_days": float(p.get("interval_days", 0.0)),
                    "repetitions": int(p.get("repetitions", 0)),
                    "due_date": p.get("due_date"),
                    "is_marked_known": bool(p.get("is_marked_known", False)),
                    "correct_count": int(p.get("correct_count", 0)),
                    "wrong_count": int(p.get("wrong_count", 0)),
                }

        target_lesson_ids = None
        if lesson_id is not None:
            matching_l = next((l for l in self.lessons_data if l["id"] == lesson_id or l.get("lesson_number") == lesson_id), None)
            if matching_l:
                target_lesson_ids = {matching_l["id"], matching_l.get("lesson_number")}
            else:
                target_lesson_ids = {lesson_id}

        matched = []
        search_lower = (search or "").strip().lower()

        for w in self.words_data:
            if target_lesson_ids is not None and w["lesson_id"] not in target_lesson_ids:
                continue

            if search_lower:
                if (
                    search_lower not in w["word"].lower()
                    and search_lower not in (w.get("meaning_vi") or "").lower()
                    and search_lower not in (w.get("definition_en") or "").lower()
                ):
                    continue

            p = prog_map.get(str(w["id"]), {})
            w_status = p.get("status", "new")
            if status and w_status != status:
                continue

            matched.append({
                **w,
                "status": w_status,
                "ease_factor": p.get("ease_factor", 2.5),
                "interval_days": p.get("interval_days", 0.0),
                "repetitions": p.get("repetitions", 0),
                "due_date": p.get("due_date"),
                "is_marked_known": p.get("is_marked_known", False),
                "correct_count": p.get("correct_count", 0),
                "wrong_count": p.get("wrong_count", 0),
            })

        total = len(matched)
        paginated = matched[offset : offset + limit]
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "words": paginated,
        }

    def batch_mark_words(self, user_id: str, word_ids: List[int], is_marked_known: bool) -> int:
        count = 0
        for wid in word_ids:
            try:
                self.mark_word_known(user_id, wid, is_marked_known)
                count += 1
            except Exception:
                pass
        return count

    def create_test(
        self,
        user_id: str,
        scope: str = "lesson",
        lesson_ids: Optional[List[int]] = None,
        test_type: str = "mixed",
        question_count: int = 10,
    ) -> dict:
        pool: List[dict] = []
        if scope in ("lesson", "multi_lesson") and lesson_ids:
            pool = [w for w in self.words_data if w["lesson_id"] in lesson_ids]
        elif scope == "learning_only":
            state_data = self.get_user_state(user_id)
            learning_wids = {
                int(wid) for wid, p in state_data["word_progress_map"].items()
                if p.get("status") in ("learning", "learned")
            }
            pool = [w for w in self.words_data if w["id"] in learning_wids]
            if len(pool) < question_count:
                extra = [w for w in self.words_data if w["id"] not in learning_wids]
                pool.extend(random.sample(extra, min(len(extra), question_count - len(pool))))
        else:
            pool = list(self.words_data)

        if not pool:
            pool = list(self.words_data)

        sample_size = min(len(pool), max(1, question_count))
        selected_words = random.sample(pool, sample_size)

        available_types = ["multiple_choice", "reverse", "listening", "fill_blank"]
        session_id = str(uuid.uuid4())
        questions = []
        session_questions_internal = []

        all_meanings = [w["meaning_vi"] for w in self.words_data if w.get("meaning_vi")]
        all_words = [w["word"] for w in self.words_data if w.get("word")]

        for idx, w in enumerate(selected_words):
            q_type = random.choice(available_types) if test_type == "mixed" else test_type
            options = []
            options_detail = []
            prompt = ""
            hint = None
            blank_length = None

            if q_type == "multiple_choice":
                prompt = w["word"]
                correct = w["meaning_vi"]
                distractor_words = random.sample(
                    [other for other in self.words_data if other["id"] != w["id"] and other.get("meaning_vi") != correct],
                    min(3, len(self.words_data) - 1),
                )
                chosen = distractor_words + [w]
                random.shuffle(chosen)
                options = [cw["meaning_vi"] for cw in chosen]
                options_detail = [
                    {
                        "text": cw["meaning_vi"],
                        "word": cw["word"],
                        "part_of_speech": cw.get("part_of_speech"),
                        "meaning_vi": cw["meaning_vi"],
                        "definition_en": cw.get("definition_en"),
                    }
                    for cw in chosen
                ]
            elif q_type in ("reverse", "listening"):
                prompt = w["meaning_vi"] if q_type == "reverse" else "Nghe và chọn từ đúng:"
                correct = w["word"]
                distractor_words = random.sample(
                    [other for other in self.words_data if other["id"] != w["id"] and other["word"].lower() != correct.lower()],
                    min(3, len(self.words_data) - 1),
                )
                chosen = distractor_words + [w]
                random.shuffle(chosen)
                options = [cw["word"] for cw in chosen]
                options_detail = [
                    {
                        "text": cw["word"],
                        "word": cw["word"],
                        "part_of_speech": cw.get("part_of_speech"),
                        "meaning_vi": cw["meaning_vi"],
                        "definition_en": cw.get("definition_en"),
                    }
                    for cw in chosen
                ]
            elif q_type == "fill_blank":
                prompt = f"Nghĩa: {w['meaning_vi']} (Từ bắt đầu bằng chữ '{w['word'][0]}')"
                correct = w["word"]
                blank_length = len(w["word"])
                hint = f"{w['word'][0]}{'_' * (len(w['word']) - 1)}"
                options = None
                options_detail = None
            else:
                prompt = w["word"]
                correct = w["meaning_vi"]
                options = [w["meaning_vi"]]
                options_detail = [
                    {
                        "text": w["meaning_vi"],
                        "word": w["word"],
                        "part_of_speech": w.get("part_of_speech"),
                        "meaning_vi": w["meaning_vi"],
                        "definition_en": w.get("definition_en"),
                    }
                ]

            q_payload = {
                "question_index": idx,
                "word_id": w["id"],
                "question_type": q_type,
                "prompt": prompt,
                "audio_url": w.get("audio_url"),
                "audio_word": w["word"] if q_type == "listening" else None,
                "audio_word_id": w["id"],
                "options": options if options else None,
                "options_detail": options_detail if options_detail else None,
                "blank_length": blank_length,
                "hint": hint,
            }
            questions.append(q_payload)

            session_questions_internal.append({
                "word_id": w["id"],
                "word": w["word"],
                "meaning_vi": w["meaning_vi"],
                "question_type": q_type,
                "correct_answer": correct,
            })

        # Insert session into test_sessions table
        lesson_id = lesson_ids[0] if (lesson_ids and len(lesson_ids) == 1) else None
        try:
            self.supabase.table("test_sessions").insert({
                "id": session_id,
                "user_id": user_id,
                "lesson_id": lesson_id,
                "test_type": test_type,
                "total_questions": len(questions),
                "correct_answers": 0,
                "score_percent": 0.0,
                "started_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception:
            pass

        # Cache internal questions into mock buffer for quick lookup or fallback
        if not hasattr(self, "_cached_sessions"):
            self._cached_sessions = {}
        self._cached_sessions[session_id] = {
            "questions_internal": session_questions_internal,
            "test_type": test_type,
            "user_id": user_id,
            "started_at": datetime.now(timezone.utc),
        }

        return {
            "id": session_id,
            "test_type": test_type,
            "total_questions": len(questions),
            "questions": questions,
        }

    def submit_test(self, user_id: str, test_id: str, answers: List[dict]) -> dict:
        user_id = ensure_valid_uuid(user_id)
        now = datetime.now(timezone.utc)
        cached = getattr(self, "_cached_sessions", {}).get(test_id)

        if not cached:
            # Reconstruct session if serverless instance was recycled or created elsewhere
            session_db = None
            try:
                s_res = self.supabase.table("test_sessions").select("*").eq("id", test_id).execute()
                if s_res.data:
                    session_db = s_res.data[0]
            except Exception as e:
                print(f"⚠️ Query test_sessions warning: {e}")

            test_type = session_db.get("test_type", "mixed") if session_db else "mixed"
            started_at = session_db.get("started_at", now.isoformat()) if session_db else now.isoformat()

            questions_internal = []
            for a in answers:
                wid = a["word_id"]
                w = self.words_by_id.get(wid)
                if not w:
                    continue
                q_type = a.get("question_type") or ("listening" if test_type == "listening" else "multiple_choice")
                if q_type == "multiple_choice":
                    correct_ans = w["meaning_vi"]
                else:
                    correct_ans = w["word"]
                questions_internal.append({
                    "word_id": wid,
                    "word": w["word"],
                    "meaning_vi": w["meaning_vi"],
                    "question_type": q_type,
                    "correct_answer": correct_ans,
                })

            cached = {
                "questions_internal": questions_internal,
                "test_type": test_type,
                "user_id": user_id,
                "started_at": started_at,
            }

        user_answer_map = {a["word_id"]: str(a.get("user_answer", "")).strip() for a in answers}

        results = []
        answers_to_insert = []
        wrong_wids = []
        correct_count = 0
        total = len(cached["questions_internal"])

        for q in cached["questions_internal"]:
            wid = q["word_id"]
            u_ans = user_answer_map.get(wid, "").strip()
            correct_ans = q["correct_answer"].strip()

            is_correct = (u_ans.lower() == correct_ans.lower())
            if not is_correct and q["word"].lower() == u_ans.lower():
                is_correct = True
            elif not is_correct and q["meaning_vi"].lower() == u_ans.lower():
                is_correct = True

            if is_correct:
                correct_count += 1
            else:
                wrong_wids.append(wid)

            w_obj = self.words_by_id.get(wid, {})
            results.append({
                "word_id": wid,
                "word": q["word"],
                "meaning_vi": q["meaning_vi"],
                "part_of_speech": w_obj.get("part_of_speech"),
                "definition_en": w_obj.get("definition_en"),
                "question_type": q["question_type"],
                "user_answer": u_ans,
                "correct_answer": correct_ans,
                "is_correct": is_correct,
            })

            answers_to_insert.append({
                "test_session_id": test_id,
                "word_id": wid,
                "question_type": q["question_type"],
                "is_correct": is_correct,
                "user_answer": u_ans,
                "correct_answer": correct_ans,
                "answered_at": now.isoformat(),
            })

        # BATCH UPDATE WRONG WORDS (1 select + 1 upsert instead of 20 sequential network calls)
        if wrong_wids:
            try:
                existing_res = self.supabase.table("user_word_progress").select("*").eq("user_id", user_id).in_("word_id", wrong_wids).execute()
                existing_map = {r["word_id"]: r for r in (existing_res.data or [])}

                uwp_upserts = []
                for wid in wrong_wids:
                    cur = existing_map.get(wid)
                    if cur:
                        uwp_upserts.append({
                            "user_id": user_id,
                            "word_id": wid,
                            "status": "learning",
                            "wrong_count": (cur.get("wrong_count") or 0) + 1,
                            "due_date": now.isoformat(),
                            "updated_at": now.isoformat(),
                        })
                    else:
                        uwp_upserts.append({
                            "user_id": user_id,
                            "word_id": wid,
                            "status": "learning",
                            "ease_factor": 2.3,
                            "interval_days": 1.0,
                            "repetitions": 0,
                            "due_date": now.isoformat(),
                            "correct_count": 0,
                            "wrong_count": 1,
                            "is_marked_known": False,
                            "updated_at": now.isoformat(),
                        })

                if uwp_upserts:
                    self.supabase.table("user_word_progress").upsert(uwp_upserts, on_conflict="user_id,word_id").execute()
            except Exception as e:
                print(f"⚠️ Batch upsert user_word_progress warning: {e}")

        score_percent = round((correct_count / total) * 100, 1) if total > 0 else 0.0

        # Update test_session
        try:
            self.supabase.table("test_sessions").upsert({
                "id": test_id,
                "user_id": user_id,
                "test_type": cached["test_type"],
                "total_questions": total,
                "correct_answers": correct_count,
                "score_percent": score_percent,
                "finished_at": now.isoformat(),
            }, on_conflict="id").execute()

            if answers_to_insert:
                self.supabase.table("test_answers").insert(answers_to_insert).execute()
        except Exception as e:
            print(f"⚠️ Update test_sessions in DB warning: {e}")

        # Save to local mock sessions as fallback
        self._mock_sessions[test_id] = {
            "id": test_id,
            "user_id": user_id,
            "test_type": cached["test_type"],
            "total_questions": total,
            "correct_answers": correct_count,
            "score_percent": score_percent,
            "started_at": cached["started_at"].isoformat() if hasattr(cached["started_at"], "isoformat") else str(cached["started_at"]),
            "finished_at": now.isoformat(),
        }

        # Lightweight streak update without scanning all 598 words
        try:
            today = date.today()
            self.supabase.table("user_state").upsert({
                "user_id": user_id,
                "last_active_at": now.isoformat(),
                "last_streak_date": today.isoformat(),
            }, on_conflict="user_id").execute()
        except Exception:
            pass

        return {
            "id": test_id,
            "test_type": cached["test_type"],
            "total_questions": total,
            "correct_answers": correct_count,
            "score_percent": score_percent,
            "results": results,
            "started_at": cached["started_at"],
            "finished_at": now,
        }

    def get_test_history(self, user_id: str) -> List[dict]:
        user_id = ensure_valid_uuid(user_id)
        items = []
        try:
            res = (
                self.supabase.table("test_sessions")
                .select("*")
                .eq("user_id", user_id)
                .not_.is_("finished_at", "null")
                .order("started_at", desc=True)
                .execute()
            )
            for s in (res.data or []):
                items.append({
                    "id": s["id"],
                    "test_type": s.get("test_type", "mixed"),
                    "total_questions": s.get("total_questions", 0),
                    "correct_answers": s.get("correct_answers", 0),
                    "score_percent": float(s.get("score_percent") or 0.0),
                    "started_at": s.get("started_at"),
                    "finished_at": s.get("finished_at"),
                })
        except Exception:
            pass

        # Merge mock sessions
        for s_id, s in self._mock_sessions.items():
            if s.get("user_id") == user_id and not any(it["id"] == s_id for it in items):
                items.append(s)

        items.sort(key=lambda x: str(x.get("started_at")), reverse=True)
        return items

    def get_dashboard_summary(self, user_id: str) -> dict:
        state_data = self.get_user_state(user_id)
        summary = state_data["summary"]

        status_breakdown = {
            "new": summary["words_new"],
            "learning": summary["words_learning"],
            "learned": summary["words_learned"],
            "mastered": summary["words_mastered"],
        }

        # Urgent lessons calculation
        due_by_lesson = {}
        now = datetime.now(timezone.utc)
        for wid_str, p in state_data["word_progress_map"].items():
            st = p.get("status", "new")
            due_str = p.get("due_date")
            if due_str and st in ("learning", "learned", "mastered"):
                try:
                    due_dt = datetime.fromisoformat(due_str.replace("Z", "+00:00"))
                    if due_dt <= now:
                        w = self.words_by_id.get(int(wid_str))
                        if w:
                            lid = w["lesson_id"]
                            due_by_lesson[lid] = due_by_lesson.get(lid, 0) + 1
                except Exception:
                    pass

        urgent_lessons = []
        for l in self.lessons_data[:10]:
            lid = l["id"]
            due_c = due_by_lesson.get(lid, 0)
            lp = next((p for p in state_data["lessons_progress"] if p["lesson_id"] == lid), None)
            urgent_lessons.append({
                "lesson_id": lid,
                "lesson_number": l["lesson_number"],
                "title_en": l["title_en"],
                "title_vi": l["title_vi"],
                "due_count": due_c,
                "total_words": lp["words_total"] if lp else 12,
                "learned_words": lp["words_learned"] if lp else 0,
            })

        urgent_lessons.sort(key=lambda x: (x["due_count"], -x["learned_words"]), reverse=True)

        return {
            "total_words": summary["total_words"],
            "words_learned_or_mastered": summary["words_learned"] + summary["words_mastered"],
            "overall_progress_percent": summary["overall_progress_percent"],
            "status_breakdown": status_breakdown,
            "streak_days": state_data["streak_days"],
            "total_study_seconds": state_data["total_study_seconds"],
            "due_reviews_count": summary["due_reviews_count"],
            "urgent_lessons": urgent_lessons[:5],
        }

    def get_leaderboard(self, current_user_id: str, sort_by: str = "words_learned", limit: int = 50) -> dict:
        current_user_id = ensure_valid_uuid(current_user_id)
        sort_key = sort_by if sort_by in ("words_learned", "words_mastered", "avg_test_score", "streak_days", "total_study_seconds") else "words_learned"

        if not hasattr(self, "_leaderboard_cache"):
            self._leaderboard_cache = {}

        now_ts = datetime.now(timezone.utc).timestamp()
        cache_entry = self._leaderboard_cache.get(sort_key)

        if cache_entry and (now_ts - cache_entry["ts"] < 180):
            rows = cache_entry["rows"]
        else:
            rows = []
            try:
                res = self.supabase.table("leaderboard_view").select("*").order(sort_key, desc=True).limit(100).execute()
                rows = res.data or []
            except Exception:
                pass

            if not rows:
                profiles = []
                try:
                    p_res = self.supabase.table("profiles").select("id, display_name").limit(100).execute()
                    profiles = p_res.data or []
                except Exception:
                    pass

                if not any(p["id"] == current_user_id for p in profiles):
                    profiles.append({"id": current_user_id, "display_name": "Bạn"})

                for p in profiles:
                    uid = p["id"]
                    state_data = self.get_user_state(uid, p.get("display_name", ""))
                    summary = state_data["summary"]
                    tests = self.get_test_history(uid)
                    avg_score = round(sum(t.get("score_percent", 0.0) for t in tests) / len(tests), 1) if tests else 0.0
                    rows.append({
                        "user_id": uid,
                        "display_name": p.get("display_name") or "Học viên",
                        "words_learned": summary["words_learned"] + summary["words_mastered"],
                        "words_mastered": summary["words_mastered"],
                        "avg_test_score": avg_score,
                        "streak_days": state_data.get("streak_days", 0),
                        "total_study_seconds": state_data.get("total_study_seconds", 0),
                    })
                rows.sort(key=lambda x: (x.get(sort_key, 0), x.get("words_learned", 0)), reverse=True)

            self._leaderboard_cache[sort_key] = {"ts": now_ts, "rows": rows}

        ranked_items = []
        my_rank_item = None
        for idx, item in enumerate(rows, start=1):
            is_me = (item["user_id"] == current_user_id)
            leaderboard_item = {
                "rank": idx,
                "user_id": item["user_id"],
                "display_name": item.get("display_name") or "Học viên",
                "words_learned": int(item.get("words_learned") or 0),
                "words_mastered": int(item.get("words_mastered") or 0),
                "avg_test_score": float(item.get("avg_test_score") or 0.0),
                "streak_days": int(item.get("streak_days") or 0),
                "total_study_seconds": int(item.get("total_study_seconds") or 0),
                "is_current_user": is_me,
            }
            ranked_items.append(leaderboard_item)
            if is_me:
                my_rank_item = leaderboard_item

        if not my_rank_item:
            my_state = self.get_user_state(current_user_id)
            my_summary = my_state["summary"]
            my_tests = self.get_test_history(current_user_id)
            my_avg = round(sum(t.get("score_percent", 0.0) for t in my_tests) / len(my_tests), 1) if my_tests else 0.0
            my_rank_item = {
                "rank": len(ranked_items) + 1,
                "user_id": current_user_id,
                "display_name": my_state.get("display_name") or "Bạn",
                "words_learned": my_summary["words_learned"] + my_summary["words_mastered"],
                "words_mastered": my_summary["words_mastered"],
                "avg_test_score": my_avg,
                "streak_days": my_state.get("streak_days", 0),
                "total_study_seconds": my_state.get("total_study_seconds", 0),
                "is_current_user": True,
            }

        return {
            "sort_by": sort_key,
            "items": ranked_items[:limit],
            "my_rank": my_rank_item,
        }

    def get_my_leaderboard_rank(self, current_user_id: str, sort_by: str = "words_learned") -> dict:
        data = self.get_leaderboard(current_user_id, sort_by=sort_by, limit=100)
        return data.get("my_rank") or {
            "rank": 1,
            "user_id": current_user_id,
            "display_name": "Bạn",
            "words_learned": 0,
            "words_mastered": 0,
            "avg_test_score": 0.0,
            "streak_days": 0,
            "total_study_seconds": 0,
            "is_current_user": True,
        }


# Singleton factory
_repo_instance = None


def get_repository() -> BaseRepository:
    global _repo_instance
    if _repo_instance is not None:
        return _repo_instance

    if not settings.MOCK_DB and settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY and create_client:
        if settings.SUPABASE_SERVICE_ROLE_KEY.startswith("sb_publishable_"):
            print("\n" + "=" * 80)
            print("⚠️  CHÚ Ý VỀ SUPABASE KEY:")
            print("   SUPABASE_SERVICE_ROLE_KEY trong backend/.env đang là Anon/Publishable key ('sb_publishable_...').")
            print("   Key này chỉ dùng cho Frontend. Backend cần 'service_role' (secret) key để có quyền ghi DB.")
            print("👉 Cách lấy service_role key:")
            print("   1. Vào Supabase Dashboard -> Project Settings -> API")
            print("   2. Tại mục 'Project API keys', tìm dòng 'service_role' (bấm Reveal để copy secret key)")
            print("   3. Dán key đó vào SUPABASE_SERVICE_ROLE_KEY trong file 'backend/.env'")
            print("🔄 Backend đang dùng Mock DB dự phòng để ứng dụng không bị lỗi 500!")
            print("=" * 80 + "\n")
            _repo_instance = MockRepository()
            return _repo_instance

        try:
            client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            # Test if required tables exist in Supabase schema
            client.table("user_state").select("user_id").limit(1).execute()
            _repo_instance = SupabaseRepository(client)
            print("✅ Kết nối Supabase Postgres thành công! Đã xác thực bảng 'user_state'.")
            return _repo_instance
        except Exception as e:
            err_str = str(e)
            if "PGRST205" in err_str or "schema cache" in err_str or "user_state" in err_str:
                print("\n" + "=" * 80)
                print("⚠️  CHÚ Ý: Chưa tìm thấy bảng 'public.user_state' trên Supabase (Lỗi PGRST205)!")
                print("👉 Nguyên nhân: Bạn chưa chạy file migration SQL trên Supabase Dashboard.")
                print("👉 Cách khắc phục đơn giản trong 1 phút:")
                print("   1. Mở Supabase Dashboard (https://supabase.com/dashboard/project/...)")
                print("   2. Vào mục 'SQL Editor' (biểu tượng >_ ở thanh bên trái)")
                print("   3. Mở file 'supabase/migrations/0001_init.sql' trong thư mục dự án, copy toàn bộ nội dung, dán vào và bấm 'Run'")
                print("   4. Chạy script nạp từ vựng: python3 scripts/seed_words.py")
                print("🔄 Trong lúc chưa chạy migration, Backend tự động chuyển sang chế độ Mock DB")
                print("   để app vẫn hoạt động mượt mà, không bị lỗi 500!")
                print("=" * 80 + "\n")
            else:
                print(f"⚠️ Warning: Không thể kết nối tới Supabase ({e}), tự động chuyển sang MockRepository.")

    _repo_instance = MockRepository()
    return _repo_instance
