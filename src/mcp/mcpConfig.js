// Docker Hub MCP Configuration
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

/**
 * MCP Server Configuration,
 * Using the Docker Hub MCP Server image from Docker Hub
 */
export const mcpServers = {
    "dockerHubMcp": {
        command: "docker",
        args: [
            "run",
            "-i",
            "--rm",
            "-e",
            "HUB_PAT_TOKEN",
            "mcp/dockerhub",
            "--transport=stdio",
            `--username=${process.env.DOCKER_USERNAME}`,
        ],
        env: {
            HUB_PAT_TOKEN: process.env.HUB_PAT_TOKEN,
        },
    }
};
