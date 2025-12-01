// Gemini LLM client wrapper for generating plans, summaries, and tool calls.

import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

/**
 * It can also work without specifying the API key
 * The client gets the API key from the environment variable `GEMINI_API_KEY`.
 */
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function runGemini(prompt, tools = []) {
    const request = {
        model: process.env.GEMINI_MODEL,
        contents: prompt,
    };

    if (tools.length) {
        request.config = { tools };
    }

    const response = await ai.models.generateContent(request);
    return response;
}


