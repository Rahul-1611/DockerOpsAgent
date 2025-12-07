// CLI entry point that wires DockerOpsAgent commands and dispatches work to the agent graph.

import readline from "node:readline";

import { runDockerOpsAgent } from "../agents/graph.js";
import { printBanner, printHelp, printResult, printError } from "./output.js";

const THREAD_ID = "cli-session-1";

function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "dockerAI> ",
    });
}

export async function runCLI() {
    printBanner();
    printHelp();

    const rl = createInterface();
    rl.prompt();

    async function handleInterrupts(result) {
        const interrupts = result?.interrupt ?? [];
        if (!interrupts.length) {
            return null;
        }

        const payload = interrupts[0]?.value ?? interrupts[0];
        const question =
            payload?.message ??
            "Risky step detected. Approve? (y/n) ";

        const approved = await new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer.trim().toLowerCase().startsWith("y"));
            });
        });

        const decision = approved ? "approve" : "reject";
        const resumed = await runDockerOpsAgent(undefined, {
            threadId: THREAD_ID,
            resume: decision,
        });
        return resumed;
    }

    rl.on("line", async (line) => {
        const input = line.trim();

        // Empty line → just re-prompt
        if (!input) {
            rl.prompt();
            return;
        }

        // Exit commands
        if (["exit", "quit", "q"].includes(input.toLowerCase())) {
            rl.close();
            return;
        }

        // Help command
        if (["help", "h", "?"].includes(input.toLowerCase())) {
            printHelp();
            rl.prompt();
            return;
        }

        try {
            const result = await runDockerOpsAgent(input, { threadId: THREAD_ID });
            printResult(result.reply);

            let current = result;
            // Loop in case multiple interrupts occur sequentially
            // (rare for this flow, but keeps CLI robust).
            while (true) {
                const resumed = await handleInterrupts(current);
                if (!resumed) break;
                printResult(resumed.reply);
                current = resumed;
            }
        } catch (err) {
            printError(err);
        }

        rl.prompt();
    });

    rl.on("close", () => {
        console.log("\nGoodbye 👋");
        process.exit(0);
    });
}


// Allow running directly: `node src/cli/cli.js`
if (import.meta.url === `file://${process.argv[1]}`) {
    runCLI();
}
