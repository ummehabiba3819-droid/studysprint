import { NextRequest, NextResponse } from "next/server";
import { QUIZ_SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    if (!input || typeof input !== "string" || !input.trim()) {
      return NextResponse.json(
        { error: "Paste some notes or type a topic first." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing GEMINI_API_KEY. Add it to your environment variables." },
        { status: 500 }
      );
    }

    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input }] }],
          systemInstruction: { parts: [{ text: QUIZ_SYSTEM_PROMPT }] },
          generationConfig: {
            temperature: 0.6,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return NextResponse.json(
        { error: "The AI service returned an error. Please try again." },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text;

    if (!text) {
      return NextResponse.json(
        { error: "The AI didn't return any text. Try again." },
        { status: 502 }
      );
    }

    let quiz: unknown;
    try {
      quiz = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "The AI's response wasn't valid quiz data. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ quiz });
  } catch (err) {
    console.error("Quiz generation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong generating the quiz. Please try again." },
      { status: 500 }
    );
  }
}
