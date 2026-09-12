import { apiClient } from './api';

let activeAudio: HTMLAudioElement | null = null;
const memoryAudioCache = new Map<string, string>();

// Pre-warm Web Speech voices on module load so there is 0ms initial lag
let cachedVoice: SpeechSynthesisVoice | null = null;

function initVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const updateVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        cachedVoice =
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Google') ||
                v.name.includes('Natural') ||
                v.name.includes('Samantha') ||
                v.default)
          ) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          null;
      } catch {}
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }
}

initVoices();

function playWebSpeech(text: string, rate: number = 1.0): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    if (cachedVoice) {
      utterance.voice = cachedVoice;
    }
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Web Speech playback failed:', err);
    return false;
  }
}

export async function playPronunciation(
  wordId: number,
  wordText: string,
  cachedAudioUrl?: string | null,
  rate: number = 1.0
): Promise<void> {
  const cleanWord = wordText.trim();
  const cacheKey = `${wordId}_${cleanWord.toLowerCase()}`;

  // 1. Stop any currently playing audio
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {}
    activeAudio = null;
  }

  // 2. Check if we already have a cached audio URL (from DB or in-memory map)
  const knownAudioUrl = cachedAudioUrl || memoryAudioCache.get(cacheKey);
  if (knownAudioUrl) {
    try {
      const audio = new Audio(knownAudioUrl);
      activeAudio = audio;
      audio.playbackRate = rate;
      await audio.play();
      return;
    } catch (e) {
      console.warn('Cached audio playback failed, falling back:', e);
    }
  }

  // 3. Fast lookup: Try Free Dictionary API with a STRICT 600ms timeout
  // If the server doesn't respond within 600ms, abort immediately and fallback to native TTS!
  let resolvedUrl = '';
  const firstWord = cleanWord.split(' ')[0].toLowerCase().replace(/[^a-z-]/g, '');

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 600);

    const resp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${firstWord}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data[0]?.phonetics) {
        for (const p of data[0].phonetics) {
          if (p.audio && p.audio.endsWith('.mp3')) {
            resolvedUrl = p.audio;
            break;
          }
        }
      }
    }
  } catch {
    // Timed out or network unreachable - proceed to instant fallback
  }

  // If Dictionary API returned audio within 600ms, play it & save to cache
  if (resolvedUrl) {
    memoryAudioCache.set(cacheKey, resolvedUrl);
    try {
      const audio = new Audio(resolvedUrl);
      activeAudio = audio;
      audio.playbackRate = rate;
      await audio.play();

      if (wordId > 0) {
        apiClient.patch(`/api/words/${wordId}/audio`, { audio_url: resolvedUrl }).catch(() => {});
      }
      return;
    } catch (audioErr) {
      console.warn('Audio play error, falling back to Web Speech:', audioErr);
    }
  }

  // 4. Instant Fallback (0ms): Native Browser Web Speech API
  const spoken = playWebSpeech(cleanWord, rate);
  if (!spoken) {
    // 5. Secondary fallback: Google Translate TTS audio
    try {
      const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(cleanWord)}`;
      const audio = new Audio(gUrl);
      activeAudio = audio;
      audio.playbackRate = rate;
      await audio.play();
    } catch (gErr) {
      console.error('All TTS methods failed:', gErr);
    }
  }
}
