// LLM planning node that plans multi-step Docker workflows based on user requests.

import { runGemini } from "../../llm/gemini";

/**
 * Planner Node
 *
 * This node takes the user's request + existing conversation history and
 * creates a high-level plan of Docker operations the agent should execute.
 *
 * Output:
 *  - plan: Array of step descriptions
 *  - currentStep: 0
 *  - messages: appends a planner summary message
 */

export async function plannerNode(state) {

    const messages = state.messages ?? [];

    // Try to get the latest user-facing content from state
    const lastUserMessage = messages[messages.length - 1];
    const lastContent =
        typeof lastUserMessage === "string"
            ? lastUserMessage
            : lastUserMessage?.content ?? "";

    const userInput = lastContent || "Plan the next Docker operation for the user.";

    // Single Gemini "user" turn with instructions + the user's request.
    // Your runGemini() expects a `contents` array in Gemini format. :contentReference[oaicite:1]{index=1}
    const prompt = [{
        role: "user",
        parts: [
            {
                text: `
        You are a Docker operations planner. Break down the user's request into a clear,
        multi-step plan. Each step must correspond to an operation that can be done via
        the Docker MCP server (list containers, inspect, logs, stats, start, stop, remove, etc.).

        Your output MUST follow this strict JSON format:
        {
        "steps": [
            "Step 1: ...",
            "Step 2: ...",
            "Step 3: ..."
        ]
        }

        Guidelines:
        - Think step-by-step.
        - Include ONLY actionable steps.
        - Do NOT execute anything — just plan.
        - Each step should map to real Docker MCP server capabilities.
        - The executor node will handle calling tools.

        User request:
        ${userInput}
                `.trim(),
            },
        ],
    },];

    const response = await runGemini(prompt);

    // Pull text out of the Gemini response
    let rawText = "";
    const candidate = response?.candidates?.[0];
    if (candidate?.content?.parts?.length) {
        rawText = candidate.content.parts
            .map((p) => p.text || "")
            .join("\n")
            .trim();
    }

    // Try parsing JSON as instructed; if it fails, fall back.
    let steps = [];
    try {
        const parsed = JSON.parse(rawText);
        steps = Array.isArray(parsed.steps) ? parsed.steps : [];
    } catch (err) {
        // Fallback: treat each non-empty line as a step
        steps = rawText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
    }

    if (!steps.length) {
        steps = ["Could not derive a structured plan from the model output."];
    }

    const plannerSummaryMessage = {
        role: "assistant",
        type: "planner",
        content:
            "Here is the plan I will follow:\n" +
            steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
    };

    return {
        plan: steps,
        currentStep: 0,
        messages: [...messages, plannerSummaryMessage],
    };
}