// MCP Docker client wrapper for issuing container operations from the agent.
// import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { MultiServerMCPClient } from "@modelcontextprotocol/sdk/client/multiserver.js";
import { mcpServers } from "./mcpConfig";

//@langchain/mcp-adapters library to use MCP tools in LangGraph:
const client = new MultiServerMCPClient({
    dockerHubMcp: {
        transport: "stdio",
        command: mcpServers.dockerHubMcp.command,
        args: mcpServers.dockerHubMcp.args,
        env: mcpServers.dockerHubMcp.env,
    },
});

//Raw client
// export async function dockerClient() {
//     //Grab the Docker Hub MCP server config (command/args/env) from mcpConfig
//     const config = mcpServers.dockerHubMcp;
//     if (!config) {
//         throw new Error("Missing dockerHubMcp configuration");
//     }
//     const { command, args, env } = config;

//     //Create a stdio transport that will spawn the MCP server process
//     const transport = new StdioClientTransport({ command, args, env });

//     //Create the MCP client 
//     const client = new Client(
//         { name: "dockerHubClient", version: "0.1.0" },
//         { capabilities: {} }
//     );

//     // Connect the client to the server 
//     await client.connect(transport);
//     return { client, transport };
// }

// Helper to cleanly shut down the transport 
// export async function closeDockerClient(transport) {
//     if (transport?.close) {
//         await transport.close();
//     }
// }

// Cache tools at module load (ok for now)
export const dockerTools = await client.getTools();

/**
 * Optional helper: call a specific MCP tool directly (no Gemini).
 */
export async function callDockerTool(toolName, args) {
    return client.callTool({
        serverName: "dockerHubMcp",
        toolName,
        arguments: args,
    });
}