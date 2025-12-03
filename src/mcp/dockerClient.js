// MCP Docker client wrapper for issuing container operations from the agent.
// import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { mcpServers } from "./mcpConfig.js";

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
// src/mcp/dockerClient.js
// Docker Hub MCP client using @langchain/mcp-adapters.
// Exposes LangChain-compatible tools for LangGraph + an optional direct caller.


/**
 * MultiServerMCPClient setup
 *
 * Docs pattern:
 * https://docs.langchain.com/oss/javascript/langchain/mcp
 * https://v03.api.js.langchain.com/modules/_langchain_mcp_adapters.html
 */
export const dockerMcpClient = new MultiServerMCPClient({
    // Global tool config (you can tweak these if you want)
    throwOnLoadError: true,
    prefixToolNameWithServerName: false,
    additionalToolNamePrefix: "",
    // For new apps, LangChain recommends true so tool outputs use
    // standard content block types.
    useStandardContentBlocks: true,

    // MCP server definitions
    mcpServers: {
        dockerHubMcp: {
            transport: "stdio",
            command: mcpServers.dockerHubMcp.command,
            args: mcpServers.dockerHubMcp.args,
            env: mcpServers.dockerHubMcp.env,
        },
    },
});

// Load *LangChain tools* from the Docker Hub MCP server.
// These are what you pass to Gemini via `bindTools` / your LangGraph executor.
export const dockerTools = await dockerMcpClient.getTools("dockerHubMcp");

/**
 * Optional helper: call a specific Docker Hub MCP tool directly (no LLM).
 *
 * NOTE: MultiServerMCPClient doesn't expose callTool itself, but you can grab
 * the underlying MCP client and call its tools.
 */
export async function callDockerTool(toolName, args = {}) {
    const client = await dockerMcpClient.getClient("dockerHubMcp");
    if (!client) {
        throw new Error("Docker Hub MCP client is not connected.");
    }

    const result = await client.callTool({
        name: toolName,
        arguments: args,
    });

    return result;
}

/**
 * Optional cleanup if you ever need to shut things down explicitly
 * (e.g., at process exit or after tests).
 */
export async function closeDockerMcpClient() {
    await dockerMcpClient.close();
}
