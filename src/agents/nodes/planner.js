import { getPlanFromGemini } from "../../llm/gemini.js";
import { logger } from "../../utils/logger.js";
import { LLMError } from "../../utils/errors.js";

async function planner(state) {
    try {
        const messages = state.messages ?? [];
        const lastMessage = messages[messages.length - 1];

        const userContent =
            typeof lastMessage === "string"
                ? lastMessage
                : (lastMessage?.content ?? "Help me with Docker Hub.");

        const promptMessages = [
            [
                "system",
                `You are a Docker Hub operations planner.
       Break the user's request into a small number of Docker Hub steps.
       Each step must be achievable using the available Docker Hub MCP tools.
       Respond ONLY via the structured JSON schema you have been given.`,
            ],
            ["human", userContent],
        ];

        logger.info("Planner: generating plan", { userContent });
        const { parsed } = await getPlanFromGemini(promptMessages);

        const steps = parsed.steps?.length
            ? parsed.steps
            : ["Could not derive a structured plan; treat this as a single-step request."];

        const plannerMessage = {
            role: "assistant",
            content:
                "Planned steps:\n" + steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
        };

        return {
            ...state,
            plan: steps,
            currentStep: 0,
            messages: [...messages, plannerMessage],
        };
    } catch (err) {
        const error = new LLMError("Planner failed to get structured plan", err);
        logger.error(error.message, { error });
        return {
            ...state,
            error: error.message,
        };
    }
}

export default planner;
