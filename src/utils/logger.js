// Centralized logger setup for structured agent logging.

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.ERROR;

function formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...context,
    };

    // In a real app, we might want to just JSON.stringify everything.
    // For local dev friendliness, we can do a hybrid approach or just JSON.
    // Let's stick to JSON for machine readability as requested in plan.
    return JSON.stringify(logEntry);
}

export const logger = {
    debug: (message, context) => {
        if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
            console.debug(formatMessage("DEBUG", message, context));
        }
    },
    info: (message, context) => {
        if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
            console.info(formatMessage("INFO", message, context));
        }
    },
    warn: (message, context) => {
        if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
            console.warn(formatMessage("WARN", message, context));
        }
    },
    error: (message, context) => {
        if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
            console.error(formatMessage("ERROR", message, context));
        }
    },
};
