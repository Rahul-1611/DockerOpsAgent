// Gemini LLM client wrapper for generating plans, summaries, and tool calls.

import { GoogleGenAI } from "@google/genai";
import { tools } from "../mcp/dockerClient";
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

export function extractText(response) {
    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    return parts.map(p => p.text || "").join("\n").trim();
}


export async function geminiText(prompt) {
    const response = await runGemini([
        { role: "user", parts: [{ text: prompt }] }
    ]);

    return extractText(response);
}

export async function geminiWithTools(messages, tools) {
    return await runGemini(messages, tools);
}


