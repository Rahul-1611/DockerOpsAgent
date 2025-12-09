DockerOpsAgent 🚢
=================

Conversational, LangGraph-powered assistant for Docker Hub tasks. It plans, checks risky actions, executes MCP tools, and summarizes outcomes — all from a simple CLI.

Why it’s neat ✨
---------------
- Plans multi-step Docker Hub workflows and executes the right tools.
- Human-in-the-loop guardrails for create/update operations.
- Lightweight CLI with checkpointed threads so you can pause/resume.
- Structured logging for debugging (set `LOG_LEVEL`).

Architecture (text diagram) 🧭
-----------------------------
```
User CLI
  |
  v
Planner (Gemini structured plan)
  |
  v
HITL Node (risk check + interrupt/resume for create/update)
  |
  v
Executor (Gemini tool-calling -> Docker Hub MCP tools)
  |
  v
Summarizer (Gemini concise wrap-up)
```

Architecture (visual)
---------------------
![DockerOpsAgent flow](DockerOpsFlow.png)

Workflow highlights
-------------------
- Planner: breaks requests into Docker Hub steps via structured output.
- HITL: detects risky verbs (create/update/etc.), raises LangGraph interrupt for approval.
- Executor: binds MCP Docker Hub tools and runs the current step.
- Summarizer: short final response after all steps (or post-rejection).
- Checkpointing: `thread_id` keeps state across approvals/resumes.

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
