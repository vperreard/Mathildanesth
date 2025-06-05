import Logger, { logger } from '../logger';

describe('Logger', () => {
    let consoleDebugSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        // Save original env
        originalEnv = { ...process.env };
        
        // Mock console methods
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock Date.toISOString for consistent timestamps
        jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-06-04T12:00:00.000Z');
    });

    afterEach(() => {
        // Restore original env
        process.env = originalEnv;
        
        // Restore all mocks
        jest.restoreAllMocks();
    });

    describe('Logger instance creation', () => {
        it('should create logger with default config', () => {
            const testLogger = new Logger();
            
            testLogger.info('Test message');
            
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                expect.stringContaining('2025-06-04T12:00:00.000Z')
            );
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                expect.stringContaining('INFO')
            );
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                expect.stringContaining('Test message')
            );
        });

        it('should create logger with custom config', () => {
            const testLogger = new Logger({
                level: 'debug',
                includeTimestamp: false,
                includeLevel: false,
                colorize: false
            });
            
            testLogger.debug('Debug message');
            
            expect(consoleDebugSpy).toHaveBeenCalledWith('Debug message');
            expect(consoleDebugSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('2025-06-04T12:00:00.000Z')
            );
            expect(consoleDebugSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('DEBUG')
            );
        });

        it('should respect environment variables', () => {
            process.env.LOG_LEVEL = 'debug';
            process.env.NODE_ENV = 'production';
            process.env.LOG_FORMAT = 'text';
            
            const testLogger = new Logger();
            
            testLogger.debug('Debug message');
            
            expect(consoleDebugSpy).toHaveBeenCalled();
        });
    });

    describe('configure', () => {
        it('should update logger configuration', () => {
            const testLogger = new Logger({ level: 'error' });
            
            // Debug should not log at error level
            testLogger.debug('Debug message');
            expect(consoleDebugSpy).not.toHaveBeenCalled();
            
            // Reconfigure to debug level
            testLogger.configure({ level: 'debug' });
            
            // Now debug should log
            testLogger.debug('Debug message 2');
            expect(consoleDebugSpy).toHaveBeenCalled();
        });
    });

    describe('isLevelEnabled', () => {
        it('should correctly determine if log level is enabled', () => {
            const testLogger = new Logger({ level: 'warn' });
            
            expect(testLogger.isLevelEnabled('debug')).toBe(false);
            expect(testLogger.isLevelEnabled('info')).toBe(false);
            expect(testLogger.isLevelEnabled('warn')).toBe(true);
            expect(testLogger.isLevelEnabled('error')).toBe(true);
        });
    });

    describe('Log levels', () => {
        it('should log debug messages when level is debug', () => {
            const testLogger = new Logger({ level: 'debug' });
            
            testLogger.debug('Debug message');
            testLogger.info('Info message');
            testLogger.warn('Warn message');
            testLogger.error('Error message');
            
            expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
            expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
            expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        });

        it('should not log debug when level is info', () => {
            const testLogger = new Logger({ level: 'info' });
            
            testLogger.debug('Debug message');
            testLogger.info('Info message');
            testLogger.warn('Warn message');
            testLogger.error('Error message');
            
            expect(consoleDebugSpy).not.toHaveBeenCalled();
            expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
            expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        });

        it('should only log error when level is error', () => {
            const testLogger = new Logger({ level: 'error' });
            
            testLogger.debug('Debug message');
            testLogger.info('Info message');
            testLogger.warn('Warn message');
            testLogger.error('Error message');
            
            expect(consoleDebugSpy).not.toHaveBeenCalled();
            expect(consoleInfoSpy).not.toHaveBeenCalled();
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Message formatting', () => {
        it('should format message with all parts enabled', () => {
            const testLogger = new Logger({
                includeTimestamp: true,
                includeLevel: true,
                colorize: false,
                format: 'text'
            });
            
            testLogger.info('Test message');
            
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                '2025-06-04T12:00:00.000Z | INFO | Test message'
            );
        });

        it('should include metadata in JSON format', () => {
            const testLogger = new Logger({
                includeTimestamp: false,
                includeLevel: false,
                format: 'json'
            });
            
            testLogger.info('Test message', { userId: 123, action: 'login' });
            
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                'Test message | {"userId":123,"action":"login"}'
            );
        });

        it('should include metadata in text format', () => {
            const testLogger = new Logger({
                includeTimestamp: false,
                includeLevel: false,
                format: 'text'
            });
            
            testLogger.info('Test message', { userId: 123, action: 'login' });
            
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                'Test message | userId=123 | action=login'
            );
        });

        it('should handle nested objects in metadata', () => {
            const testLogger = new Logger({
                includeTimestamp: false,
                includeLevel: false,
                format: 'text'
            });
            
            testLogger.info('Test message', { 
                user: { id: 123, name: 'John' },
                simple: 'value'
            });
            
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                'Test message | user={"id":123,"name":"John"} | simple=value'
            );
        });

        it('should add colors when colorize is enabled', () => {
            const testLogger = new Logger({
                includeTimestamp: false,
                includeLevel: true,
                colorize: true
            });
            
            testLogger.error('Error message');
            
            // Check for ANSI color codes
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('\x1b[31mERROR\x1b[0m')
            );
        });
    });

    describe('Console output control', () => {
        it('should not output to console when enableConsole is false', () => {
            const testLogger = new Logger({
                enableConsole: false
            });
            
            testLogger.debug('Debug');
            testLogger.info('Info');
            testLogger.warn('Warn');
            testLogger.error('Error');
            
            expect(consoleDebugSpy).not.toHaveBeenCalled();
            expect(consoleInfoSpy).not.toHaveBeenCalled();
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });

    describe('Exported logger instance', () => {
        it('should use default configuration', () => {
            logger.info('Test message');
            
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                expect.stringContaining('INFO')
            );
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                expect.stringContaining('Test message')
            );
        });

        it('should be configurable', () => {
            logger.configure({ level: 'error' });
            
            logger.info('Should not log');
            logger.error('Should log');
            
            expect(consoleInfoSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
            
            // Reset to default for other tests
            logger.configure({ level: 'info' });
        });
    });
});