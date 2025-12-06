// Node that summarizes agent progress and outcomes for user-facing responses.
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessage } from "@langchain/core/messages";
import { baseGemini } from "../../llm/gemini.js";

const summarizerPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a Docker Hub operations summarizer.
Keep the final response short and precise (2-3 sentences or up to 3 bullets).
State what was attempted, the concrete result, and any errors.`,
    ],
    [
        "human",
        `High-level plan:
{plan}

Current step index: {currentStep}
Last tool result:
{toolResult}

Conversation transcript:
{history}

Write the final user-facing summary now.`,
    ],
]);

function coerceContentToString(msg) {
    if (!msg) return "";
    if (typeof msg === "string") return msg;
    if (typeof msg.content === "string") return msg.content;
    if (Array.isArray(msg.content)) {
        return msg.content
            .map((part) => (typeof part === "string" ? part : part.text ?? ""))
            .join("");
    }
    if ("text" in msg && typeof msg.text === "string") return msg.text;
    if ("content" in msg) return JSON.stringify(msg.content);
    return "";
}

export async function summarizer(state) {
    const messages = state.messages ?? [];
    const plan = state.plan ?? [];
    const currentStep = state.currentStep ?? 0;
    const lastToolResult = state.lastToolResult;

    const historyText = messages.map(coerceContentToString).filter(Boolean).join("\n");

    const planText =
        Array.isArray(plan) && plan.length > 0
            ? plan.map((step, idx) => `${idx + 1}. ${step}`).join("\n")
            : "No multi-step plan was generated.";

    const toolResultText =
        lastToolResult !== undefined
            ? typeof lastToolResult === "string"
                ? lastToolResult
                : JSON.stringify(lastToolResult, null, 2)
            : "No tool result captured.";

    const chain = summarizerPrompt.pipe(baseGemini);
    const aiMessage = await chain.invoke({
        plan: planText,
        currentStep,
        toolResult: toolResultText,
        history: historyText,
    });

    const summaryText = Array.isArray(aiMessage.content)
        ? aiMessage.content
              .map((part) => (typeof part === "string" ? part : part.text ?? ""))
              .join("")
              .trim()
        : String(aiMessage.content ?? "").trim();

    const summaryMessage = new AIMessage({
        content: summaryText,
        name: "summarizer",
    });

    return {
        ...state,
        summary: summaryText,
        messages: [...messages, summaryMessage],
    };
}
