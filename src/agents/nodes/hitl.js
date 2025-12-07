// Node that routes to human-in-the-loop checks before executing risky steps.
import { SystemMessage } from "@langchain/core/messages";
import { interrupt, Command } from "@langchain/langgraph";
import { logger } from "../../utils/logger.js";

/**
 * HITL Node
 *
 * Checks if the current step involves risky operations.
 * If so, it pauses for human approval using LangGraph interrupts.
 *
 * Risky keywords: create, update, remove, rm, delete, prune, kill
 */
const riskyToolKeywords = [
    "create-repository",
    "update-repository-info",
    "create repository",
    "update repository",
    "create",
    "update",
    "delete",
    "remove",
    "rm",
    "prune",
    "kill",
];

export async function hitl(state) {
    const plan = state.plan ?? [];
    const currentStepIndex = state.currentStep ?? 0;
    const messages = state.messages ?? [];

    if (
        !Array.isArray(plan) ||
        plan.length === 0 ||
        currentStepIndex >= plan.length
    ) {
        return {
            needsHumanApproval: false,
        };
    }

    const currentStepDescription = String(plan[currentStepIndex] ?? "");
    const normalized = currentStepDescription.toLowerCase();

    const isRisky = riskyToolKeywords.some((kw) => normalized.includes(kw));

    if (!isRisky) {
        logger.debug("HITL: no risky operation detected", {
            currentStepIndex,
            currentStepDescription,
        });
        return {
            needsHumanApproval: false,
        };
    }


    // ⚠️ Risky step → pause and ask for approval
    logger.warn("HITL: risky operation detected", {
        currentStepIndex,
        step: plan[currentStepIndex],
    });

    // Await LangGraph interrupt so execution pauses until resume(decision) is provided.
    const decision = await interrupt({
        type: "docker_hub_hitl",
        stepIndex: currentStepIndex,
        step: currentStepDescription,
        message: `Risky Docker Hub operation detected in step ${currentStepIndex + 1
            }: "${currentStepDescription}". Approve to continue, or reject to skip and summarize.`,
    });

    const approved =
        decision === true ||
        decision === "approve" ||
        decision === "yes" ||
        decision === "y";

    if (approved) {
        const approvalMessage = new SystemMessage({
            content: `[HITL] User approved risky step ${currentStepIndex + 1
                }: "${currentStepDescription}". Proceeding with execution.`,
        });

        // Proceed to executor next
        return new Command({
            goto: "executor",
            update: {
                needsHumanApproval: false,
                messages: [...messages, approvalMessage],
            },
        });
    }

    const rejectionMessage = new SystemMessage({
        content: `[HITL] User rejected risky step ${currentStepIndex + 1
            }: "${currentStepDescription}". Stopping execution and summarizing.`,
    });

    // Skip executor → go straight to summarizer
    return new Command({
        goto: "summarizer",
        update: {
            needsHumanApproval: true,
            messages: [...messages, rejectionMessage],
        },
    });
}
