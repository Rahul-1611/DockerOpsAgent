// Node that routes to human-in-the-loop checks before executing risky steps.

/**
 * HITL Node
 *
 * Checks if the current step involves risky operations.
 * If so, it pauses for human approval (conceptually).
 * In this simple implementation, we'll just flag it or auto-approve if not risky.
 *
 * Risky keywords: stop, remove, rm, delete, prune, kill
 */
export async function hitlNode(state) {
    const plan = state.plan ?? [];
    const currentStepIndex = state.currentStep ?? 0;

    // If we've finished the plan, nothing to check
    if (currentStepIndex >= plan.length) {
        return {};
    }

    const currentStepText = plan[currentStepIndex];
    const lowerStep = currentStepText.toLowerCase();

    const riskyKeywords = ["stop", "remove", "rm", "delete", "prune", "kill"];
    const isRisky = riskyKeywords.some((kw) => lowerStep.includes(kw));

    const messages = state.messages ?? [];

    if (isRisky) {
        // In a real system, we'd suspend execution here.
        // For this prototype, we'll just log a warning message to the conversation
        // and let the executor proceed (or we could halt).
        // Let's add a system message noting the risk.
        const warningMsg = {
            role: "assistant",
            type: "system",
            content: `[HITL] Risky operation detected: "${currentStepText}". Proceeding with caution (or waiting for approval in a real app).`
        };
        return {
            messages: [...messages, warningMsg]
        };
    }

    // Not risky
    return {};
}
