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

        // inside rl.on("line", async (line) => { ... } )
        try {
            const result = await runDockerOpsAgent(input, { threadId: THREAD_ID });

            // 1) Print the natural-language reply (summarizer)
            printResult(result.reply);

            // // 2) ALSO print the raw tool result if present
            // const lastToolResult = result?.state?.lastToolResult;
            // if (lastToolResult !== undefined) {
            //     console.log("\n--- Raw tool result ---");
            //     printResult(lastToolResult);
            // }

            // let current = result;
            // while (true) {
            //     const resumed = await handleInterrupts(current);
            //     if (!resumed) break;

            //     printResult(resumed.reply);

            //     const resumedToolResult = resumed?.state?.lastToolResult;
            //     if (resumedToolResult !== undefined) {
            //         console.log("\n--- Raw tool result ---");
            //         printResult(resumedToolResult);
            //     }

            //     current = resumed;
            // }
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
