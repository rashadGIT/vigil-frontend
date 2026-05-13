import axios from 'axios';

// Public API client — no auth headers injected
// Used for: POST /intake/:slug, GET /signatures/token/:token, POST /signatures/:token/sign
export const publicApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
  // No withCredentials: true — no cookies needed for public endpoints
});
