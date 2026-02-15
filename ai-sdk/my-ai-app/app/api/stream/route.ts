import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
    try{
        const { prompt } = await req.json();

        // It is very important to not use await here because we want to stream the text in real time
        const result = streamText({
            model: openai("gpt-4.1-nano"),
            prompt: prompt,
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Error streaming text:", error);
        return new Response("Failed to stream text", { status: 500 });
    }
}