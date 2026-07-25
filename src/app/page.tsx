"use client";

import { useEffect, useState } from "react";
import { QuizAttempt, QuizQuestion } from "@/lib/types";
import { getAttempts, saveAttempt } from "@/lib/storage";

type Stage = "input" | "quiz" | "result";

interface QuizData {
  topic: string;
  questions: QuizQuestion[];
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("input");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  // Reading localStorage (an external system) after mount to avoid
  // server/client hydration mismatches.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttempts(getAttempts());
  }, []);

  async function handleGenerate() {
    if (!input.trim()) {
      setError("Paste some notes or type a topic first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate quiz.");

      const q = data.quiz as QuizData;
      if (!q?.questions?.length) throw new Error("Quiz came back empty. Try again.");

      setQuiz(q);
      setAnswers(new Array(q.questions.length).fill(null));
      setStage("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(qIndex: number, optIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optIndex;
      return next;
    });
  }

  function handleSubmitQuiz() {
    if (!quiz) return;
    const score = quiz.questions.reduce(
      (sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0),
      0
    );
    const attempt: QuizAttempt = {
      id: crypto.randomUUID(),
      topic: quiz.topic,
      score,
      total: quiz.questions.length,
      date: new Date().toISOString().slice(0, 10),
    };
    saveAttempt(attempt);
    setAttempts(getAttempts());
    setStage("result");
  }

  function handleRestart() {
    setStage("input");
    setInput("");
    setQuiz(null);
    setAnswers([]);
    setError(null);
  }

  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);
  const score = quiz
    ? quiz.questions.reduce((sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0), 0)
    : 0;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Study Sprint
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Paste your notes, get a quiz, test yourself before the exam.
        </p>
      </header>

      {stage === "input" && (
        <section>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">
            Your notes, or just a topic name
          </label>
          <textarea
            className="min-h-48 w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Paste your class notes here, or just type something like "the French Revolution" or "React useEffect hook" if you don't have notes handy.`}
          />
          {error && (
            <p className="mt-2 text-sm text-[var(--color-incorrect)]">{error}</p>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-4 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] disabled:opacity-60"
          >
            {loading ? "Building your quiz…" : "Generate quiz"}
          </button>

          {attempts.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
                Your past attempts
              </h2>
              <div className="space-y-2">
                {attempts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{a.topic}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{a.date}</p>
                    </div>
                    <p className="font-[family-name:var(--font-display)] font-semibold">
                      {a.score}/{a.total}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>
      )}

      {stage === "quiz" && quiz && (
        <section>
          <p className="mb-6 text-sm text-[var(--color-text-muted)]">
            Quiz on: <span className="text-[var(--color-text)]">{quiz.topic}</span>
          </p>
          <div className="space-y-6">
            {quiz.questions.map((q, qi) => (
              <div
                key={qi}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <p className="mb-3 font-medium">
                  {qi + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(qi, oi)}
                      className="block w-full rounded-lg border px-3 py-2 text-left text-sm transition"
                      style={{
                        borderColor:
                          answers[qi] === oi ? "var(--color-accent)" : "var(--color-border)",
                        backgroundColor:
                          answers[qi] === oi ? "var(--color-surface-raised)" : "transparent",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmitQuiz}
            disabled={!allAnswered}
            className="mt-6 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] disabled:opacity-40"
          >
            Submit answers
          </button>
        </section>
      )}

      {stage === "result" && quiz && (
        <section>
          <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">Your score</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold">
              {score} / {quiz.questions.length}
            </p>
          </div>

          <div className="space-y-4">
            {quiz.questions.map((q, qi) => {
              const correct = answers[qi] === q.correctIndex;
              return (
                <div
                  key={qi}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: correct ? "var(--color-correct)" : "var(--color-incorrect)",
                  }}
                >
                  <p className="mb-2 font-medium">
                    {qi + 1}. {q.question}
                  </p>
                  <p className="text-sm">
                    Your answer:{" "}
                    <span style={{ color: correct ? "var(--color-correct)" : "var(--color-incorrect)" }}>
                      {answers[qi] !== null ? q.options[answers[qi]!] : "—"}
                    </span>
                  </p>
                  {!correct && (
                    <p className="text-sm text-[var(--color-correct)]">
                      Correct answer: {q.options[q.correctIndex]}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{q.explanation}</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleRestart}
            className="mt-6 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)]"
          >
            Try another quiz
          </button>
        </section>
      )}
    </main>
  );
}
