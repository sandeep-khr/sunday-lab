"use client";

import { useState } from "react";

export default function CompletionPage() {


    const [prompt, setPrompt] = useState(""); // user input
    const [completion, setCompletion] = useState(""); // AI response
    const [isLoading, setIsLoading] = useState(false); // loading state

    const [error, setError] = useState<string | null>(null); // error state
    
    // complete the prompt
    const complete = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setIsLoading(true);
        setError(null); // clear previous error when starting new request
        setPrompt("");

        try {
            const response = await fetch("/api/completion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setCompletion(data.text);
        } catch (error) {
            console.error("Error:", error);
            setError(error instanceof Error ? error.message : "An unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            {/* display area for the completion */}
            {
                isLoading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )
                : completion ? (
                    <div className="text-center">
                        <p className="text-lg font-medium">{completion}</p>
                    </div>
                ) : null
            }

            {error && (
                <div className="text-red-500 text-center">
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <form
                onSubmit={complete}
                className="fixed bottom-0 w-full max-w-md mx-auto left-0 right-0 p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 shadow-lg"
            >
                <div className="flex gap-2">
                    <input 
                        className="flex-1 dark:bg-zinc-800 p-2 border border-zinc-300 dark:border-zinc-700 rounded shadow-xl"
                        placeholder="Enter your prompt" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                        >{isLoading ? "Thinking..." : "Send"}</button>
                </div>
      </form>
    </div>
  );
}