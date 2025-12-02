// Shared agent state definition and helpers for persisting conversation or task context.

import { MessagesZodMeta } from "@langchain/langgraph";
import * as z from "zod";
import { registry } from "@langchain/langgraph/zod";

export const AgentState = z.object({
    // Chat history; `MessagesZodMeta` makes sure messages merge correctly
    // instead of just concatenating or overwriting. :contentReference[oaicite:1]{index=1}
    messages: z
        .array(z.custom())
        .register(registry, MessagesZodMeta),

    // High-level multi-step plan, e.g. ["List containers", "Inspect X", "Restart X"]
    plan: z.array(z.string()).optional(),

    // Index into `plan` for the current step (0-based)
    currentStep: z.number().int().nonnegative().optional(),

    // Running summary of what the agent has done so far
    summary: z.string().optional(),

    // Used by the HITL node to pause/resume on risky actions
    needsHumanApproval: z.boolean().optional(),

    // Last Docker MCP tool call result (can be any JSON shape)
    lastToolResult: z.unknown().optional(),

    // Optional error field you can set in any node for debugging / control flow
    error: z.string().optional(),
})

/**
 * Helper to create a clean initial state from a first user message.
 * You can use this in your CLI when you invoke the graph.
 */
export function initialAgentState(firstMessage) {
    return {
        messages: firstMessage ? [firstMessage] : [],
        plan: undefined,
        currentStep: undefined,
        summary: undefined,
        needsHumanApproval: false,
        lastToolResult: undefined,
        error: undefined,
    }
}