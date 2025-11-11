// By default, Node.js doesn’t automatically load environment variables from .env files.
// The dotenv package reads the .env file and adds those variables into process.env, which is where Node stores all environment variables.

import dotenv from "dotenv";
dotenv.config(); // tells dotenv to read the .env file in your project root (by default)

import { Agent, run } from "@openai/agents";

const agent = new Agent({
    name: "Assistant",
    instructions: "You are a helpful assistant that talk in emojis.",
})

const results = await run(agent, "Tell me a joke about computers.", );
console.log(results.finalOutput);