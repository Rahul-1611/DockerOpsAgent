// Node that routes to human-in-the-loop checks before executing risky steps.
import { SystemMessage } from "@langchain/core/messages";
/**
 * HITL Node
 *
 * Checks if the current step involves risky operations.
 * If so, it pauses for human approval (conceptually).
 * In this simple implementation, we'll just flag it or auto-approve if not risky.
 *
 * Risky keywords: stop, remove, rm, delete, prune, kill
 */

const riskyToolKeywords = [
    "create-repository",
    "update-repository-info",
    "create repository",
    "update repository",
    "create",
    "update",
];

export async function hitlNode(state) {
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

    const currentStepDescription = String(plan[currentStepIndex] ?? "").toLowerCase();

    const isRisky = riskyToolKeywords.some((kw) =>
        currentStepDescription.includes(kw)
    );

    if (!isRisky) {
        return {
            needsHumanApproval: false,
        };
    }

    const warning = new SystemMessage({
        content: `[HITL] Risky Docker Hub operation detected in step ${currentStepIndex + 1
            }: "${plan[currentStepIndex]}". Human approval is required before executing this step (create/update).`,
    });

    return {
        needsHumanApproval: true,
        messages: [...messages, warning],
    };
}
