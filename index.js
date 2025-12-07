#!/usr/bin/env node

import { runCLI } from "./src/cli/cli.js";

// Top-level error handler
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
});

// Start the CLI
runCLI().catch((err) => {
    console.error("Fatal error starting CLI:", err);
    process.exit(1);
});
