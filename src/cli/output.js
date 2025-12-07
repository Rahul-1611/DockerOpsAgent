// CLI output helpers for formatting and streaming agent responses to the console.


function printBanner() {
    console.log("=======================================");
    console.log("  DockerOpsAgent - Conversational CLI");
    console.log("=======================================\n");
}

function printHelp() {
    console.log("Type a natural language request and press Enter.");
    console.log("Special commands:");
    console.log("  help        Show this help message");
    console.log("  exit, quit  Leave the CLI");
    console.log("");
    console.log("Examples:");
    console.log('  list all running containers');
    console.log('  show logs for the most recent failed container');
    console.log('  stop all containers with errors\n');
}

function printResult(result) {
    console.log("\n--- Agent Response ---");

    if (typeof result === "string") {
        console.log(result);
        console.log("");
        return;
    }

    try {
        console.log(JSON.stringify(result, null, 2));
    } catch {
        console.log(result);
    }

    console.log("");
}

function printError(error) {
    console.error("\n!!! Error running DockerOpsAgent !!!");
    if (error?.message) {
        console.error("Message:", error.message);
    } else {
        console.error(error);
    }

    if (error?.stack) {
        console.error("\nStack:");
        console.error(error.stack);
    }
    console.error("");
}

export {
    printBanner,
    printHelp,
    printResult,
    printError
};
