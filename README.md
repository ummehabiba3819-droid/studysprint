# Study Sprint — Turn Your Notes Into a Quiz

**Live app:** https://studysprint-self.vercel.app
**Repo:** https://github.com/ummehabiba3819-droid/studysprint

## The problem I'm solving, and who it's for

When I'm studying for an exam, re-reading my notes feels productive but doesn't actually test whether I know the material. What actually works is quizzing myself — but writing my own quiz questions from scratch takes time I don't have before an exam.

Study Sprint solves this: paste in your notes (or just type a topic if you don't have notes handy), and it instantly generates a 5-question quiz to test yourself. You get scored, see explanations for anything you got wrong, and your past attempts are saved so you can track how you're improving over time.

It's built for students — including myself — who are revising before a test and want an active way to check what they actually know, not just re-read.

## What you can do in this app

- **Paste your notes, or just a topic name** — if you have real notes, the quiz is generated strictly from them. If you don't, you can type a topic (like "the French Revolution" or "React useEffect") and the AI will quiz you on it using general knowledge at an appropriate level.
- **Take an AI-generated 5-question multiple-choice quiz** — one question at a time isn't required; all 5 are shown together, you answer at your own pace, then submit.
- **See your score immediately**, along with the correct answer and a short explanation for every question — including the ones you got right, so you reinforce why.
- **Track your quiz history** — every attempt (topic, score, date) is saved automatically and shown on the home screen, so you can see your progress across study sessions.
- **Try another quiz any time** — generate a fresh quiz on a new topic whenever you want.

## The AI feature — how it works

When you click "Generate quiz," your notes (or topic) are sent to an AI model along with a system prompt I wrote to keep it strict and genuinely useful for studying — not generating random trivia or padding out fake facts.

**Model used:** Google Gemini (`gemini-flash-latest`), called directly from a server-side API route, so the API key never reaches the browser.

**The system prompt I wrote** (in `src/lib/prompts.ts`):

```
You are a study-quiz generator inside Study Sprint, an app that helps students test themselves before exams.

You will be given either:
(a) A block of the student's own notes/study material, or
(b) A short topic name if they didn't paste notes

Your job: generate exactly 5 multiple-choice questions to test understanding of that material.

Rules you must follow:
- If real notes/material were provided, base every question strictly on facts, definitions, or concepts that actually appear in that material. Do not test on things not covered in the notes.
- If only a topic name was given (no real notes), you may use your general knowledge of that topic, but keep questions at an appropriate introductory/intermediate level for a student studying it.
- Each question must have exactly 4 answer options, with exactly one correct answer.
- Vary question difficulty: mix straightforward recall questions with a couple of questions that require understanding, not just memorization.
- Write a short one-sentence explanation for each correct answer, so the student learns something even if they get it wrong.
- Do not make questions trick questions or intentionally ambiguous.
- Keep question and option text concise and clear.

Output ONLY valid JSON, in exactly this shape, with no markdown code fences, no preamble, no explanation outside the JSON:

{
  "topic": "short 2-5 word label summarizing what this quiz covers",
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}

The "questions" array must contain exactly 5 items. "correctIndex" must be an integer 0-3 indicating the index of the correct option.
```

I specifically designed this to stop the AI from testing on things that aren't in the student's actual notes, and to force it to return clean, structured data I can reliably turn into an interactive quiz in the app.

## An intentional design choice: no login, no external database

This app doesn't have user accounts, and it doesn't use an external database. Instead, your quiz history is saved directly in your browser's local storage.

This was a deliberate choice, not a shortcut: it makes the app simpler, faster, and removes any dependency on a third-party database service that could have downtime. The tradeoff is that your history is tied to the specific browser/device you use — it won't sync across devices, and clearing your browser data will erase it. For a personal study tool used in the moment before an exam, this tradeoff felt like the right one.

## What I used to build this

- **Framework:** Next.js (App Router) with TypeScript
- **UI:** Tailwind CSS v4
- **AI model:** Google Gemini (`gemini-flash-latest`), called via a direct server-side fetch to the Gemini API
- **Storage:** Browser localStorage (no external database)
- **Hosting:** Vercel

## Screenshots

![Input screen — paste notes or a topic](./screenshots/dashboard.png)
![Quiz in progress](./screenshots/quiz.png)
![Results with score and explanations](./screenshots/result.png)
![Home screen showing quiz history](./screenshots/result-history.png)

## How to run this project yourself

**You'll need:** Node.js, and a free Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

1. Clone the repo:
   ```
   git clone https://github.com/ummehabiba3819-droid/studysprint.git
   cd studysprint
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file in the project root:
   ```
   GEMINI_API_KEY=your-gemini-api-key
   ```
4. Run the dev server:
   ```
   npm run dev
   ```
5. Open the local URL shown in your terminal, paste in some notes or a topic, and generate your first quiz.

## Live deployment

The live version is hosted on Vercel:
**https://studysprint-self.vercel.app**

Anyone can open this link and use the app right away — no account or login needed.
