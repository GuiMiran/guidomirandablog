/**
 * Agents Module
 * 
 * Central export point for all agents in the agentic system
 */

// Base infrastructure
export { BaseAgent, AgentValidationError } from './base';
export type { Agent, AgentContext } from './base';

// Agent implementations
export * from './planner';
export * from './executor';
export * from './coder';
export * from './reviewer';
export * from './orchestrator';

// Convenience exports for common workflows
import { plannerAgent } from './planner';
import { executorAgent } from './executor';
import { coderAgent } from './coder';
import { reviewerAgent } from './reviewer';
import { orchestrator } from './orchestrator';
import type { OrchestratorRequest } from './orchestrator';

export const agents = {
  planner: plannerAgent,
  executor: executorAgent,
  coder: coderAgent,
  reviewer: reviewerAgent
} as const;

export const workflows = {
  orchestrate: (req: OrchestratorRequest) => orchestrator.orchestrate(req)
} as const;
