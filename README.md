# DockerOpsAgent

DockerOpsAgent is an intelligent, conversational CLI agent designed to help you manage Docker Hub operations using natural language.

Built with **LangGraph** and powered by **Gemini 2.5 Flash**, it connects to Docker Hub via the **Model Context Protocol (MCP)** to perform tasks like listing repositories, checking image tags, and more.

## Features

-   **Natural Language Interface**: Ask for what you need (e.g., "List all my repositories").
-   **Agentic Workflow**: Uses a Planner-Executor-Summarizer architecture to break down complex requests.
-   **Human-in-the-Loop (HITL)**: Automatically pauses for approval before executing risky operations (like deleting repositories).
-   **Structured Logging**: JSON-based logging for easy observability.
-   **Extensible**: Built on the standard MCP ecosystem.

## Setup

### Prerequisites

-   **Node.js** (v18 or higher)
-   **Docker Desktop** (must be running, as the agent spawns the MCP server as a container)
-   **Docker Hub Account** (Username and Personal Access Token)
-   **Google Gemini API Key**

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd DockerOpsAgent
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
    Create a `.env` file in the root directory with the following keys:

    ```env
    # Required
    GEMINI_API_KEY=your_gemini_api_key
    HUB_PAT_TOKEN=your_docker_hub_pat
    DOCKER_USERNAME=your_docker_hub_username

    # Optional
    LOG_LEVEL=INFO  # DEBUG, INFO, WARN, ERROR (default: ERROR)
    GEMINI_MODEL=gemini-2.5-flash # Default: gemini-2.5-flash
    ```

### Running the Agent

Ensure Docker is running, then start the CLI:

```bash
node index.js
```

## Usage

Once started, type your requests into the CLI:

```text
dockerAI> list all repositories in my namespace
dockerAI> show details for the latest ubuntu image
```

Type `help` to see available commands or `exit` to quit.
