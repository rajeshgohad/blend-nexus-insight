 /**
  * API Configuration
  * 
  * Configure the backend URL based on environment.
  * For local development, the Python backend runs on port 3001.
  */
 
 // Backend URL - can be configured via environment variable
 export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
 
 // API Key for authentication (optional for dev)
 export const API_KEY = import.meta.env.VITE_API_KEY || 'dev-api-key-change-in-production';
 
 // Common headers for all API requests
 export const getHeaders = () => ({
   'Content-Type': 'application/json',
   'X-API-Key': API_KEY,
 });
 
 // Generic API response type
 export interface ApiResponse<T> {
   success: boolean;
   data?: T;
   error?: string;
   count?: number;
 }
 
 // Generic fetch wrapper with error handling
 export async function apiRequest<T>(
   endpoint: string,
   options: RequestInit = {}
 ): Promise<ApiResponse<T>> {
   try {
     const response = await fetch(`${API_BASE_URL}${endpoint}`, {
       ...options,
       headers: {
         ...getHeaders(),
         ...options.headers,
       },
     });
 
     const data = await response.json();
 
     if (!response.ok) {
       throw new Error(data.detail || data.error || `HTTP error ${response.status}`);
     }
 
     return data;
   } catch (error) {
     console.error(`API request failed: ${endpoint}`, error);
     throw error;
   }
 }