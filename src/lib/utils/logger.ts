/**
 * Structured Logging System
 * 
 * Provides consistent logging across the application with:
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 * - Structured context
 * - Trace ID propagation
 * - JSON output for log aggregation
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  traceId?: string;
  service: 'skill' | 'agent' | 'orchestrator' | 'api' | 'system';
  operation: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevel = (process.env.LOG_LEVEL as LogLevel) || this.minLevel;
    const currentLevelIndex = levels.indexOf(currentLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Human-readable format for development
      const timestamp = entry.context.timestamp.toISOString();
      const level = entry.level.toUpperCase().padEnd(5);
      const service = entry.context.service.padEnd(12);
      const traceId = entry.context.traceId?.slice(0, 8) || '--------';
      
      let message = `[${timestamp}] ${level} [${service}] [${traceId}] ${entry.message}`;
      
      if (entry.context.metadata && Object.keys(entry.context.metadata).length > 0) {
        message += `\n  Metadata: ${JSON.stringify(entry.context.metadata, null, 2)}`;
      }
      
      if (entry.error) {
        message += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack) {
          message += `\n${entry.error.stack}`;
        }
      }
      
      return message;
    } else {
      // JSON format for production
      return JSON.stringify(entry);
    }
  }

  private write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formatted = this.formatLog(entry);

    switch (entry.level) {
      case 'debug':
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context: LogContext): void {
    this.write({
      level: 'debug',
      message,
      context: { ...context, timestamp: context.timestamp || new Date() }
    });
  }

  info(message: string, context: LogContext): void {
    this.write({
      level: 'info',
      message,
      context: { ...context, timestamp: context.timestamp || new Date() }
    });
  }

  warn(message: string, context: LogContext): void {
    this.write({
      level: 'warn',
      message,
      context: { ...context, timestamp: context.timestamp || new Date() }
    });
  }

  error(message: string, context: LogContext, error?: Error): void {
    const entry: LogEntry = {
      level: 'error',
      message,
      context: { ...context, timestamp: context.timestamp || new Date() }
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      };
    }

    this.write(entry);
  }

  // Convenience method for creating child loggers with inherited context
  child(baseContext: Partial<LogContext>): ChildLogger {
    return new ChildLogger(this, baseContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private baseContext: Partial<LogContext>
  ) {}

  private mergeContext(context: LogContext): LogContext {
    return {
      ...this.baseContext,
      ...context,
      metadata: {
        ...this.baseContext.metadata,
        ...context.metadata
      }
    } as LogContext;
  }

  debug(message: string, context: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, context: LogContext, error?: Error): void {
    this.parent.error(message, this.mergeContext(context), error);
  }
}

// Singleton instance
export const logger = new Logger();

// Utility functions for common logging scenarios
export const logSkillExecution = (
  skillId: string,
  traceId: string,
  duration: number,
  success: boolean
) => {
  logger.info(`Skill execution ${success ? 'completed' : 'failed'}`, {
    service: 'skill',
    operation: skillId,
    traceId,
    timestamp: new Date(),
    metadata: {
      duration_ms: duration,
      success
    }
  });
};

export const logAgentProcess = (
  agentId: string,
  traceId: string,
  duration: number,
  success: boolean
) => {
  logger.info(`Agent process ${success ? 'completed' : 'failed'}`, {
    service: 'agent',
    operation: agentId,
    traceId,
    timestamp: new Date(),
    metadata: {
      duration_ms: duration,
      success
    }
  });
};

export const logAPIRequest = (
  endpoint: string,
  method: string,
  traceId: string,
  statusCode: number,
  duration: number
) => {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger[level](`API request ${method} ${endpoint}`, {
    service: 'api',
    operation: endpoint,
    traceId,
    timestamp: new Date(),
    metadata: {
      method,
      status_code: statusCode,
      duration_ms: duration
    }
  });
};
