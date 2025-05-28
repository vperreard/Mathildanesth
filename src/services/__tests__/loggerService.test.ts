import { 
  LogLevel,
  Logger,
  createLogger,
  log,
  logError,
  logWarning,
  logInfo,
  logDebug
} from '../loggerService';

// Mock console methods
const originalConsole = { ...console };

describe('loggerService', () => {
  beforeEach(() => {
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
  });

  afterEach(() => {
    // Restore original console
    Object.assign(console, originalConsole);
  });

  describe('LogLevel enum', () => {
    it('should define all log levels', () => {
      expect(LogLevel.ERROR).toBeDefined();
      expect(LogLevel.WARN).toBeDefined();
      expect(LogLevel.INFO).toBeDefined();
      expect(LogLevel.DEBUG).toBeDefined();
    });
  });

  describe('log function', () => {
    it('should log error messages', () => {
      log(LogLevel.ERROR, 'Test error message');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Test error message'
      );
    });

    it('should log warning messages', () => {
      log(LogLevel.WARN, 'Test warning message');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        'Test warning message'
      );
    });

    it('should log info messages', () => {
      log(LogLevel.INFO, 'Test info message');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Test info message'
      );
    });

    it('should log debug messages', () => {
      log(LogLevel.DEBUG, 'Test debug message');
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Test debug message'
      );
    });

    it('should include timestamp in log', () => {
      log(LogLevel.INFO, 'Test message');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        'Test message'
      );
    });
  });

  describe('convenience functions', () => {
    it('should log error with logError', () => {
      logError('Error message');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Error message'
      );
    });

    it('should log warning with logWarning', () => {
      logWarning('Warning message');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        'Warning message'
      );
    });

    it('should log info with logInfo', () => {
      logInfo('Info message');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Info message'
      );
    });

    it('should log debug with logDebug', () => {
      logDebug('Debug message');
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Debug message'
      );
    });
  });

  describe('Logger class', () => {
    it('should create logger with context', () => {
      const logger = new Logger('TestModule');
      
      logger.error('Test error');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[TestModule]'),
        'Test error'
      );
    });

    it('should support different log levels', () => {
      const logger = new Logger('TestModule');
      
      logger.error('Error');
      logger.warn('Warning');
      logger.info('Info');
      logger.debug('Debug');
      
      expect(console.error).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.debug).toHaveBeenCalled();
    });

    it('should handle objects and arrays', () => {
      const logger = new Logger('TestModule');
      const testObject = { id: 1, name: 'test' };
      
      logger.info('Object:', testObject);
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Object:',
        testObject
      );
    });
  });

  describe('createLogger factory', () => {
    it('should create logger with specified context', () => {
      const logger = createLogger('MyModule');
      
      logger.info('Test message');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[MyModule]'),
        'Test message'
      );
    });

    it('should create logger with default context', () => {
      const logger = createLogger();
      
      logger.info('Test message');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[Logger]'),
        'Test message'
      );
    });
  });

  describe('Log filtering by level', () => {
    it('should respect minimum log level', () => {
      // Assume we have a way to set minimum log level
      const logger = createLogger('TestModule', LogLevel.WARN);
      
      logger.debug('Debug message'); // Should not log
      logger.info('Info message');   // Should not log
      logger.warn('Warning message'); // Should log
      logger.error('Error message');  // Should log
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
});