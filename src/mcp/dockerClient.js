// MCP Docker client wrapper for issuing container operations from the agent.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mcpServers } from "./mcpConfig";

export async function dockerClient() {
    const config = mcpServers.dockerHubMcp;
    if (!config) {
        throw new Error("Missing dockerHubMcp configuration");
    }
    const { command, args, env } = config;
    const transport = new StdioClientTransport({ command, args, env });

    const client = new Client(
        { name: "dockerHubClient", version: "0.1.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    return { client, transport };
}

export async function closeDockerClient(transport) {
    if (transport?.close) {
        await transport.close();
    }
}
