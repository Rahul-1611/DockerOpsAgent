// Gemini LLM client wrapper for generating plans, summaries, and tool calls.
// src/llm/gemini.js
// LangChain-friendly Gemini wrapper for LangGraph:
// - base chat model
// - structured-output model for the planner
// - helper to create a tool-calling model for the executor

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as z from "zod";
import dotenv from "dotenv";

dotenv.config();

// --- Base model setup -------------------------------------------------------

const MODEL_NAME = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
}

/**
 * Base Gemini chat model (no tools bound).
 * Docs: Chat models + invoke: https://docs.langchain.com/oss/javascript/langchain/models
 */
export const baseGemini = new ChatGoogleGenerativeAI({
    model: MODEL_NAME,
    apiKey: API_KEY,
    temperature: 0,
    maxRetries: 2,
});

// --- Structured output for the planner -------------------------------------

/**
 * Planner schema:
 * LangChain structured output docs: https://docs.langchain.com/oss/javascript/langchain/structured-output
 */
export const PlanSchema = z.object({
    steps: z
        .array(
            z
                .string()
                .describe("A single high-level Docker Hub operation the agent should perform.")
        )
        .describe("Ordered list of steps to satisfy the user's request."),
});

export const plannerModel = baseGemini.withStructuredOutput(PlanSchema, {
    // includeRaw lets you see the underlying AIMessage if you want later
    includeRaw: true,
});

export async function getPlanFromGemini(promptMessages) {
    // promptMessages can be a string or an array of chat messages
    const result = await plannerModel.invoke(promptMessages);
    // result = { parsed, raw } because we used includeRaw: true
    return result;
}

// --- Tool-calling model for the executor -----------------------------------

/**
 * Create a tool-calling model for the executor node.
 *
 * Usage pattern follows the tools docs:
 *   const llmWithTools = baseGemini.bindTools(tools);
 *   const aiMsg = await llmWithTools.invoke(messages);
 *
 * Tools are passed in by the caller (e.g., dockerTools from dockerClient),
 * so we don't import MCP stuff here to avoid circular deps.
 *
 * Tools docs: https://docs.langchain.com/oss/javascript/langchain/tools
 */
export function makeToolCallingModel(tools) {
    if (!tools || tools.length === 0) {
        return baseGemini; // fall back to plain chat model
    }
    return baseGemini.bindTools(tools);
}