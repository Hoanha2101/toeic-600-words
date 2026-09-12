export type WordStatus = 'new' | 'learning' | 'learned' | 'mastered';

export interface Word {
  id: number;
  lesson_id: number;
  word: string;
  part_of_speech?: string;
  definition_en?: string;
  related_forms?: string;
  meaning_vi?: string;
  audio_url?: string | null;
  audio_url_uk?: string | null;
  // user progress fields
  status?: WordStatus;
  ease_factor?: number;
  interval_days?: number;
  repetitions?: number;
  due_date?: string | null;
  is_marked_known?: boolean;
  correct_count?: number;
  wrong_count?: number;
}

export interface LessonProgress {
  words_total: number;
  words_learned: number;
  words_mastered: number;
  is_completed: boolean;
  progress_percent: number;
}

export interface Lesson {
  id: number;
  lesson_number: number;
  title_en: string;
  title_vi: string;
  progress: LessonProgress;
  words?: Word[];
}

export interface UserStateSummary {
  total_words: number;
  words_learned: number;
  words_mastered: number;
  words_learning: number;
  words_new: number;
  overall_progress_percent: number;
  due_reviews_count: number;
}

export interface WordProgressItem {
  word_id: number;
  status: WordStatus;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_date: string;
  is_marked_known: boolean;
  correct_count: number;
  wrong_count: number;
}

export interface LessonProgressItem {
  lesson_id: number;
  lesson_number: number;
  words_total: number;
  words_learned: number;
  words_mastered: number;
  is_completed: boolean;
  progress_percent: number;
}

export interface UserStateResponse {
  user_id: string;
  display_name?: string;
  current_lesson_id: number;
  current_lesson_number: number;
  current_word_index: number;
  current_mode: 'learn' | 'flashcard' | 'review' | 'test';
  streak_days: number;
  last_streak_date?: string | null;
  total_study_seconds: number;
  summary: UserStateSummary;
  lessons_progress: LessonProgressItem[];
  word_progress_map: Record<string, WordProgressItem>;
}

export type Sm2Rating = 'again' | 'hard' | 'good' | 'easy';

export interface TestQuestion {
  question_index: number;
  word_id: number;
  question_type: 'multiple_choice' | 'reverse' | 'listening' | 'fill_blank';
  prompt: string;
  audio_url?: string | null;
  options?: string[] | null;
  blank_length?: number | null;
  hint?: string | null;
}

export interface TestSession {
  id: string;
  test_type: string;
  total_questions: number;
  questions: TestQuestion[];
}

export interface TestResultAnswer {
  word_id: number;
  word: string;
  meaning_vi: string;
  question_type: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export interface TestResult {
  id: string;
  test_type: string;
  total_questions: number;
  correct_answers: number;
  score_percent: number;
  results: TestResultAnswer[];
  started_at: string;
  finished_at: string;
}

export interface TestHistoryItem {
  id: string;
  test_type: string;
  total_questions: number;
  correct_answers: number;
  score_percent: number;
  started_at: string;
  finished_at?: string;
}

export interface DashboardSummary {
  total_words: number;
  words_learned_or_mastered: number;
  overall_progress_percent: number;
  status_breakdown: {
    new: number;
    learning: number;
    learned: number;
    mastered: number;
  };
  streak_days: number;
  total_study_seconds: number;
  due_reviews_count: number;
  urgent_lessons: {
    lesson_id: number;
    lesson_number: number;
    title_en: string;
    title_vi: string;
    due_count: number;
    total_words: number;
    learned_words: number;
  }[];
}
