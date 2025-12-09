// Node that summarizes agent progress and outcomes for user-facing responses.
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessage } from "@langchain/core/messages";
import { baseGemini } from "../../llm/gemini.js";
import { logger } from "../../utils/logger.js";
import { LLMError } from "../../utils/errors.js";

// If you already have this helper defined elsewhere in this file, keep that one.
function coerceContentToString(msg) {
    if (!msg) return "";
    if (typeof msg === "string") return msg;

    // LangChain message objects or raw content shapes
    if (typeof msg.content === "string") return msg.content;
    if (Array.isArray(msg.content)) {
        return msg.content
            .map((part) => {
                if (typeof part === "string") return part;
                if (typeof part?.text === "string") return part.text;
                return "";
            })
            .join(" ");
    }

    if (typeof msg.text === "string") return msg.text;

    try {
        return JSON.stringify(msg);
    } catch {
        return String(msg);
    }
}

const summarizerPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a Docker Hub operations summarizer AND data formatter.

You receive:
- The original user request
- The execution plan (steps)
- The name of the last Docker Hub tool that was called
- The raw tool result as text (often containing JSON)
- The conversation history so far

Your job:
- Understand what the user wanted.
- Inspect the raw tool result (including any JSON in the text).
- Extract the most important information and present it cleanly.
- NEVER dump large raw JSON blobs.
- Prefer short, structured output:
  - For lists (repositories, tags, images, etc.), use bullets or a simple list.
  - For each item, show only key fields (e.g., name, namespace, pull_count, last_updated).
- If there was an error, clearly state what failed in 1–2 sentences.

Keep the final response short and precise (2–3 sentences or up to 5 bullets).`,
    ],
    [
        "human",
        `User request:
{userInput}

Execution plan:
{plan}

Current step index:
{currentStep}

Last tool called:
{toolName}

Raw tool result:
{lastToolResult}

Conversation history:
{history}

Using the above, produce a concise answer for the user. 
If possible, extract and format the essential data (e.g., a clean list of repositories). 
Avoid printing raw JSON or excessively long text.`,
    ],
]);

export async function summarizer(state) {
    try {
        const messages = state.messages ?? [];
        const plan = state.plan ?? [];
        const currentStep = state.currentStep ?? 0;
        const lastToolResult = state.lastToolResult;

        // 1) User request (assume first message is the user input)
        const firstMessage = messages[0];
        const userInput = coerceContentToString(firstMessage);

        // 2) History (all messages flattened)
        const historyText = messages
            .map(coerceContentToString)
            .filter(Boolean)
            .join("\n");

        // 3) Plan as simple numbered text
        const planText =
            Array.isArray(plan) && plan.length > 0
                ? plan.map((step, idx) => `${idx + 1}. ${step}`).join("\n")
                : "No multi-step plan was generated.";

        // 4) Handle different shapes of lastToolResult
        let toolName = "unknown";
        let rawResultText = "No tool result captured.";

        if (lastToolResult !== undefined && lastToolResult !== null) {
            // Preferred shape: { toolName, raw }
            if (
                typeof lastToolResult === "object" &&
                ("raw" in lastToolResult || "toolName" in lastToolResult)
            ) {
                toolName = lastToolResult.toolName ?? "unknown";
                const raw = lastToolResult.raw ?? lastToolResult;
                rawResultText =
                    typeof raw === "string"
                        ? raw
                        : (() => {
                            try {
                                return JSON.stringify(raw, null, 2);
                            } catch {
                                return String(raw);
                            }
                        })();
            } else {
                // Backwards compatible: plain string / JSON / anything else
                toolName = "unknown";
                rawResultText =
                    typeof lastToolResult === "string"
                        ? lastToolResult
                        : (() => {
                            try {
                                return JSON.stringify(lastToolResult, null, 2);
                            } catch {
                                return String(lastToolResult);
                            }
                        })();
            }
        }

        const chain = summarizerPrompt.pipe(baseGemini);
        const aiMessage = await chain.invoke({
            userInput,
            plan: planText,
            currentStep,
            toolName,
            lastToolResult: rawResultText,
            history: historyText,
        });

        logger.info("Summarizer: generated summary");

        const summaryText = Array.isArray(aiMessage.content)
            ? aiMessage.content
                .map((part) =>
                    typeof part === "string" ? part : part.text ?? ""
                )
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
    } catch (err) {
        const error = new LLMError("Summarizer failed", err);
        logger.error(error.message, { error });
        return {
            ...state,
            error: error.message,
        };
    }
}
