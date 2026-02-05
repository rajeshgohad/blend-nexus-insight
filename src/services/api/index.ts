 /**
  * API Services Index
  * 
  * Central export for all API services connecting to the Python FastAPI backend.
  */
 
 export * from './config';
 export * from './maintenanceApi';
 export * from './yieldApi';
 export * from './visionApi';
 export * from './schedulingApi';
 
 // Re-export individual APIs for convenience
 export { maintenanceApi } from './maintenanceApi';
 export { yieldApi } from './yieldApi';
 export { visionApi } from './visionApi';
 export { schedulingApi } from './schedulingApi';