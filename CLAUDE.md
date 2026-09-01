# CLAUDE.md

## Project overview
This repository contains the production React implementation of the **“Eventos - solicitação”** design handoff from Claude Design.

The app is a **React 19 + TypeScript + Vite** single-page application with **React Router v7**, **Recharts**, and a **mock data layer** backed by `localStorage` for app state such as orders, notifications, favorites, chat, and survey questions.

## Important context
- This repo originated from a design handoff bundle.
- The `project/` folder contains the original HTML prototype assets and should be treated as the source of truth for design intent.
- The `chats/` folder contains the original chat transcripts and should be read first when clarifying behavior or scope.
- The exported prototype files are not production code; they describe the intended UI, content, spacing, and interactions.

## What to do before making changes
1. Read `README.md` at the repository root.
2. Read the chat transcripts in `chats/`.
3. Review the relevant files in `project/` before changing UI or behavior.
4. If any requirement is ambiguous, ask for clarification before implementing.

## Development workflow
- Prefer small, focused changes that preserve the current UI structure and behavior.
- Keep the mock data layer isolated behind `useAppData()` and the files in `src/mock/`.
- If a backend is introduced later, replace the internals of `AppDataContext` rather than scattering API calls across the app.
- Preserve the current route structure, including nested `/admin/*` routes.
- Keep styling consistent with the existing plain CSS approach.

## Stack conventions
- Use **TypeScript** for all new application logic.
- Use **React functional components** and hooks.
- Keep page-specific CSS colocated with the page/component when possible.
- Reuse shared tokens and common classes instead of duplicating styles.
- Use `Recharts` only where chart UI already exists or is clearly needed.

## Scripts
```bash
npm install
npm run dev
npm run build
npm run preview
```

## Editing guidance
- Do not introduce a new styling system unless explicitly requested.
- Avoid large refactors unrelated to the current task.
- Preserve existing Portuguese UI copy unless a change in content is requested.
- Make sure new work continues to support the current pages and flows documented in `app/README.md`.

## When in doubt
If behavior, layout, or content differs between the prototype files and the React app, follow the design handoff and ask for confirmation if needed.
