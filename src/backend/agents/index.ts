/**
 * AI Agents Module
 * 
 * This module exports all AI agent services for use in the application
 * or for deployment as standalone backend services on Node.js platforms.
 * 
 * Deployment Options:
 * - Node.js Express/Fastify server
 * - AWS Lambda
 * - Azure Functions
 * - Google Cloud Functions
 * - Supabase Edge Functions
 * 
 * Usage Example (Node.js):
 * ```typescript
 * import { MaintenanceAgent, YieldOptimizationAgent } from './agents';
 * 
 * // Analyze component for maintenance
 * const decision = MaintenanceAgent.analyzeComponent(componentData, schedule);
 * 
 * // Generate yield recommendations
 * const recommendations = YieldOptimizationAgent.generateRecommendations(
 *   signals, profile, sopLimits
 * );
 * ```
 */

// Export types
export * from './types';

// Export maintenance agent
export { 
  MaintenanceAgent,
  predictRUL,
  detectAnomalies,
  analyzeComponent,
  findIdleWindow,
} from './maintenance-agent';

// Export yield optimization agent
export {
  YieldOptimizationAgent,
  detectDrift,
  predictYield,
  generateRecommendations,
  validateRecommendation,
  DEFAULT_SOP_LIMITS,
  DEFAULT_SPECS,
} from './yield-optimization-agent';
