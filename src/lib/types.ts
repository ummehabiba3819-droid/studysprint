export interface QuizQuestion {
  question: string;
  options: string[]; // exactly 4 options
  correctIndex: number; // 0-3
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  topic: string; // short label for what was studied (derived from input)
  score: number;
  total: number;
  date: string; // ISO date string
}
