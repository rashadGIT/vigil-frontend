# Copilot Agent Instructions

## Project Overview

This is the frontend for Kelova — a multi-tenant SaaS platform for independent funeral homes. Built with Next.js 14 App Router, TypeScript strict mode, and Tailwind CSS.

## Stack

- **Framework**: Next.js 14 App Router
- **Language**: TypeScript (strict mode — no `any`, no implicit types)
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library (unit/component), Playwright (E2E)
- **Linting**: ESLint + Prettier (runs on commit via lint-staged)
- **Auth**: Dev bypass via `NEXT_PUBLIC_DEV_AUTH_BYPASS=true`, production uses Cognito

## How to Run Locally

```bash
npm install
NEXT_PUBLIC_DEV_AUTH_BYPASS=true NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

## Code Conventions

- Components go in `src/components/`, pages in `src/app/`
- Use server components by default; add `"use client"` only when needed (event handlers, hooks, browser APIs)
- All API calls go through `src/lib/api.ts` — never fetch directly in components
- No inline styles — Tailwind only
- No `console.log` in committed code
- Export components as named exports, not default exports (except page.tsx files)

## Testing Requirements

- Every new component needs a test in `src/__tests__/`
- Every new page needs an E2E test in `e2e/`
- Run `npm test` before marking any issue complete
- Run `npm run test:e2e` to verify E2E passes

## When Fixing a Bug

1. Reproduce it with a failing test first
2. Fix the code
3. Confirm the test passes
4. Check ESLint: `npm run lint`

## When Adding a Feature

1. Start with the component, then wire up the API call
2. Add a unit test for the component
3. Add an E2E test for the user flow
4. Do not add dependencies without a clear reason — check if the functionality already exists in the project first

## Multi-Tenancy

The app is multi-tenant. Tenant context comes from the subdomain (extracted in Next.js middleware). Never hardcode tenant IDs. The `x-tenant-id` header is injected automatically by middleware.

## Do Not

- Commit `.env` files
- Use `any` in TypeScript
- Add `console.log` statements
- Skip tests
- Use `!important` in styles
- Install packages without checking if they're already available
