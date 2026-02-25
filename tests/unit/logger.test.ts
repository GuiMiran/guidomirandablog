/**
 * Unit Tests for Logger Utility
 * 
 * Tests the structured logging system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger, logSkillExecution, logAgentProcess, logAPIRequest } from '@/lib/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should log debug messages', () => {
    // Set LOG_LEVEL to debug for this test
    process.env.LOG_LEVEL = 'debug';
    
    logger.debug('Test debug message', {
      service: 'system',
      operation: 'test',
      timestamp: new Date()
    });
    
    expect(console.log).toHaveBeenCalled();
    
    // Reset
    delete process.env.LOG_LEVEL;
  });

  it('should log info messages', () => {
    logger.info('Test info message', {
      service: 'api',
      operation: 'test',
      timestamp: new Date()
    });
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should log warnings', () => {
    logger.warn('Test warning', {
      service: 'skill',
      operation: 'test',
      timestamp: new Date()
    });
    
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log errors with stack trace', () => {
    const error = new Error('Test error');
    
    logger.error('Error occurred', {
      service: 'agent',
      operation: 'test',
      timestamp: new Date()
    }, error);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should include trace ID in logs', () => {
    const traceId = 'test-trace-123';
    
    logger.info('Test with trace', {
      service: 'api',
      operation: 'test',
      traceId,
      timestamp: new Date()
    });
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(traceId.slice(0, 8))
    );
  });
});

describe('Logging Utilities', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('logSkillExecution should log with correct context', () => {
    logSkillExecution('generate_content', 'trace-123', 500, true);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('logAgentProcess should log with correct context', () => {
    logAgentProcess('coder', 'trace-456', 1000, true);
    
    expect(console.log).toHaveBeenCalled();
  });

  it('logAPIRequest should log with correct context', () => {
    logAPIRequest('/api/ai/generate', 'POST', 'trace-789', 200, 250);
    
    expect(console.log).toHaveBeenCalled();
  });
});
