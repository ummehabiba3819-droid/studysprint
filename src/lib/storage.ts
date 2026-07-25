import { QuizAttempt } from "./types";

const STORAGE_KEY = "studysprint:attempts";

export function getAttempts(): QuizAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: QuizAttempt) {
  const attempts = getAttempts();
  attempts.unshift(attempt); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
}

export function clearAttempts() {
  localStorage.removeItem(STORAGE_KEY);
}
