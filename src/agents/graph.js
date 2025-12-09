// Graph definition/orchestration (e.g., LangGraph) that stitches planner, executor, and summarizer nodes together.

import { StateGraph, START, END, MemorySaver, Command } from "@langchain/langgraph";

import { AgentState, initialAgentState } from "./state.js";

import { executor } from "./nodes/executor.js";
import { hitl } from "./nodes/hitl.js";
import { summarizer } from "./nodes/summarizer.js";
import planner from "./nodes/planner.js";

// Decide what to do after the HITL node.
// - If needsHumanApproval === true → skip executor, go straight to summarizer
//   (we've warned the user and we *don't* run risky tools).
// - Else → run executor.
function routeAfterHitl(state) {
    if (state.needsHumanApproval) {
        return "summarizer";
    }
    return "executor";
}

// Decide what to do after executor based on remaining plan steps.
function routeAfterExecutor(state) {
    const plan = state.plan ?? [];
    const currentStep = state.currentStep ?? 0;
    const hasMoreSteps = Array.isArray(plan) && plan.length > 0 && currentStep < plan.length;
    return hasMoreSteps ? "hitl" : "summarizer";
}

const builder = new StateGraph(AgentState)
    // Nodes
    .addNode("planner", planner)
    .addNode("hitl", hitl, {
        // This tells LangGraph that hitl can route directly to these nodes via Command.goto
        ends: ["executor", "summarizer"],
    })
    .addNode("executor", executor)
    .addNode("summarizer", summarizer)
    .addEdge(START, "planner")
    .addEdge("planner", "hitl")
    .addConditionalEdges("hitl", routeAfterHitl, ["executor", "summarizer"])
    .addConditionalEdges("executor", routeAfterExecutor, ["hitl", "summarizer"])
    .addEdge("summarizer", END);

// In-memory checkpointer for short-term memory + HITL
const checkpointer = new MemorySaver();

// Compile final graph with persistence
export const dockerOpsGraph = builder.compile({
    checkpointer,
});

/**
 * High-level helper for your CLI / server.
 *

 *   - threadId: string  // required for memory/HITL per session
 *   - config:  object   // optional extra LangGraph config
 */
export async function runDockerOpsAgent(userInput, options = {}) {
    const { threadId = "cli-thread", resume, config: extraConfig } = options;

    // Initial values for this turn.
    const values =
        resume !== undefined
            ? new Command({ resume })
            : initialAgentState(userInput);

    const config = {
        configurable: {
            thread_id: threadId,
            ...(extraConfig?.configurable ?? {}),
        },
        // Preserve any other config fields (tags, callbacks, etc.)
        ...extraConfig,
    };

    const finalState = await dockerOpsGraph.invoke(values, config);
    const interrupts = finalState.__interrupt__ ?? [];

    const messages = finalState.messages ?? [];
    const lastMessage = messages[messages.length - 1];

    const reply =
        typeof lastMessage?.content === "string"
            ? lastMessage.content
            : Array.isArray(lastMessage?.content)
                ? lastMessage.content
                    .map((part) => (typeof part === "string" ? part : part.text ?? ""))
                    .join("")
                : String(lastMessage?.content ?? "Done.");

    const needsHumanInput = interrupts.length > 0;

    return {
        reply,             // what you print in CLI
        state: finalState, // full AgentState (plan, currentStep, summary, etc.)
        needsHumanInput,
        interrupt: interrupts,
    };
}

export default {
    dockerOpsGraph,
    runDockerOpsAgent,
};
