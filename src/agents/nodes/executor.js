// Node that executes planned Docker actions and tool calls.
// Node that executes planned Docker actions and tool calls.

import { dockerTools } from "../../mcp/dockerClient.js";
import { makeToolCallingModel } from "../../llm/gemini.js";
import { logger } from "../../utils/logger.js";
import { DockerError } from "../../utils/errors.js";
import {
    HumanMessage,
    SystemMessage,
    AIMessage,
    ToolMessage,
} from "@langchain/core/messages";

const llmWithTools = makeToolCallingModel(dockerTools);
const toolMap = new Map(dockerTools.map((tool) => [tool.name, tool]));

export async function executor(state) {
    try {
        const messages = state.messages ?? [];
        const plan = state.plan ?? [];
        const currentStep = state.currentStep ?? 0;

        const currentStepDescription =
            Array.isArray(plan) && plan.length > 0 && currentStep < plan.length
                ? plan[currentStep]
                : null;

        const lastMessage = messages[messages.length - 1];

        let originalUserText = "Help me with a Docker Hub operation.";
        if (lastMessage) {
            if (typeof lastMessage === "string") {
                originalUserText = lastMessage;
            } else if (typeof lastMessage.content === "string") {
                originalUserText = lastMessage.content;
            } else if (Array.isArray(lastMessage.content)) {
                originalUserText = lastMessage.content
                    .map((part) =>
                        typeof part === "string" ? part : part.text ?? ""
                    )
                    .join("");
            } else if ("text" in lastMessage && typeof lastMessage.text === "string") {
                originalUserText = lastMessage.text;
            }
        }

        const stepInstruction = currentStepDescription
            ? `Execute this step from the plan: "${currentStepDescription}".`
            : `Decide which single Docker Hub tool to use to satisfy this request: "${originalUserText}".`;

        const planningMessage = new AIMessage({
            content: currentStepDescription
                ? `Executing plan step ${currentStep + 1}: ${currentStepDescription}`
                : "Executing a single-step Docker Hub operation.",
            name: "executor",
        });

        const executorPromptMessages = [
            new SystemMessage(
                `You are a Docker Hub tools executor.
Use ONLY the available Docker Hub MCP tools to carry out the requested operation.
You MUST respond by choosing tools (tool calls) and arguments, not by doing anything yourself.`
            ),
            new HumanMessage(
                `User request:\n${originalUserText}\n\nInstruction:\n${stepInstruction}`
            ),
        ];

        const aiMessage = await llmWithTools.invoke(executorPromptMessages);
        const toolCalls = aiMessage.tool_calls ?? [];

        if (toolCalls.length === 0) {
            logger.warn("Executor: model returned no tool calls");
            return {
                ...state,
                messages: [...messages, planningMessage, aiMessage],
                error: "Model did not request any Docker Hub tool for this step.",
            };
        }

        const [toolCall] = toolCalls;
        const { name: toolName, args, id: toolCallId } = toolCall;

        const tool = toolMap.get(toolName);
        if (!tool) {
            logger.error("Executor: requested tool not found", { toolName });
            return {
                ...state,
                messages: [...messages, planningMessage, aiMessage],
                error: `Tool "${toolName}" is not available in dockerTools.`,
            };
        }

        logger.info("Executor: invoking tool", { toolName, args });
        const toolResult = await tool.invoke(args ?? {});
        logger.info("Executor: tool result", { toolName, result: toolResult });

        const toolMessage = new ToolMessage({
            tool_call_id: toolCallId,
            name: toolName,
            content: toolResult,
        });

        const hasPlan = Array.isArray(plan) && plan.length > 0;
        const nextStep = hasPlan ? currentStep + 1 : currentStep;

        return {

            ...state,
            messages: [...messages, planningMessage, aiMessage, toolMessage],
            lastToolResult: toolResult,
            currentStep: nextStep,
            error: undefined,
        };
    } catch (err) {
        const error = new DockerError("Executor failed to call Docker Hub tool", err);
        logger.error(error.message, { error });
        return {
            ...state,
            error: error.message,
        };
    }
}
