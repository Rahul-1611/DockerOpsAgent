// Shared error types/utilities for consistent agent error handling.

export class AppError extends Error {
    constructor(message, code, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.code = code || "INTERNAL_ERROR";
        this.isOperational = isOperational; // True if this is a known error type we can handle
        Error.captureStackTrace(this, this.constructor);
    }
}

export class DockerError extends AppError {
    constructor(message, originalError = null) {
        super(message, "DOCKER_ERROR");
        this.originalError = originalError;
    }
}

export class LLMError extends AppError {
    constructor(message, originalError = null) {
        super(message, "LLM_ERROR");
        this.originalError = originalError;
    }
}

export class ConfigError extends AppError {
    constructor(message) {
        super(message, "CONFIG_ERROR", false); // Config errors are usually fatal on startup
    }
}

export class WorkflowError extends AppError {
    constructor(message, stepName) {
        super(message, "WORKFLOW_ERROR");
        this.stepName = stepName;
    }
}
