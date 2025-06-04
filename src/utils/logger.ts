// Do not import winston statically here

let loggerInstance: any | null = null; // Use 'any' or create a minimal interface if needed for type safety

async function initializeLogger() {
    // Initialize only on the server
    if (typeof window === 'undefined') {
        if (!loggerInstance) {
            try {
                // Dynamically import winston only on the server
                const winston = (await import('winston')).default;
                const { transports, format } = winston;

                loggerInstance = winston.createLogger({
                    level: process.env.LOG_LEVEL || 'info',
                    format: format.combine(
                        format.timestamp(),
                        format.json()
                    ),
                    transports: [
                        new transports.Console({
                            format: format.combine(
                                format.colorize(),
                                format.simple()
                            )
                        })
                    ]
                });

                // Add file transports only on the server
                loggerInstance.add(new transports.File({ filename: 'logs/error.log', level: 'error' }));
                loggerInstance.add(new transports.File({ filename: 'logs/combined.log' }));

                console.log('Winston logger initialized on server.');

            } catch (error) {
                console.error('Failed to initialize Winston logger:', error);
                // Fallback to console logging if Winston fails
                loggerInstance = console;
            }
        }
    } else {
        // On the client, use a simple console logger mock
        if (!loggerInstance) {
            console.log('Initializing console logger for client.');
            loggerInstance = {
                info: console.info,
                warn: console.warn,
                error: console.error,
                debug: console.debug,
                // Add other levels if needed, mapping to console methods
            };
        }
    }
    return loggerInstance;
}

// Export an async function to get the logger
// Ensures logger is initialized before use
export async function getLogger() {
    if (!loggerInstance) {
        await initializeLogger();
    }
    // If initialization failed on server, loggerInstance might be console
    // If on client, it will be the console mock
    return loggerInstance || console; // Fallback to console just in case
}

// Optional: Export a synchronous proxy object if needed for compatibility,
// but this might still cause issues if accessed during build/SSR before init.
// It's generally better to update calling code to use await getLogger().

/*
// Example of a synchronous proxy (use with caution):
const loggerProxy = {
    info: async (...args: any[]) => (await getLogger()).info(...args),
    warn: async (...args: any[]) => (await getLogger()).warn(...args),
    error: async (...args: any[]) => (await getLogger()).error(...args),
    debug: async (...args: any[]) => (await getLogger()).debug(...args),
    // Add other needed methods
};
export { loggerProxy as logger };
*/

// If direct export is needed and you accept potential issues:
// export const logger = await getLogger(); // Top-level await might work in newer environments

// Safer approach: force consumers to call getLogger

// Removed the old export { logger }; as logger is no longer exported directly.
// Consumers must now use `await getLogger()` to get the logger instance.

// Export a synchronous logger for compatibility
export const logger = {
    info: (...args: any[]) => console.info(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
    debug: (...args: any[]) => console.debug(...args),
}; 