import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const { text } = await generateText({
      model: openai("gpt-5-nanoasd"),
      prompt,
    });

    return Response.json({ text });
  } catch (error) {
    console.error("Error generating text:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate text";
    return Response.json({ error: message }, { status: 500 });
  }
}