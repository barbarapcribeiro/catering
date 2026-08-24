# Direct Eventos by Spark XP

Production React implementation of the "Eventos - solicitação" Claude Design prototype (see `../project` and `../chats` for the original design handoff).

## Stack

- **React 19 + TypeScript + Vite** — SPA, static production build.
- **React Router v7** — client-side routing for all 12 pages, including nested `/admin/*` routes.
- **Recharts** — charts in the admin dashboard and reports.
- **Mock data layer** (`src/mock/AppDataContext.tsx`) — a Context + `localStorage` store that stands in for a backend: orders, notifications, favorites, chat, survey questions. It's shared across every page, so e.g. an order submitted in the Coffee Break flow immediately shows up in Gerenciar Pedidos, Produção, and the admin dashboard.
- Plain CSS (tokens in `src/styles/tokens.css`, shared component classes in `src/styles/common.css`, page-specific CSS colocated with each page) — chosen over Tailwind to port the prototype's precise inline styles as accurately as possible.

## Going to a real backend later

The mock layer is intentionally isolated behind `useAppData()` and the `src/mock/` folder. Swapping in a real API means replacing the internals of `AppDataContext` (state + the mutator functions) with API calls — the page components don't need to change.

## Scripts

```
npm install
npm run dev       # local dev server
npm run build     # typecheck + production build to dist/
npm run preview   # serve the production build locally
```

## Pages

Home, Coffee Break / Evento Especial / Água / Surpreenda order flows, Gerenciar Pedidos, Produção, Fique por Dentro, Aprovações, and the Painel Administrativo section (Operação, Relatórios › Visão Geral, Pesquisa de Satisfação, plus stubs for sections that had no corresponding design in the source project: Ocorrências, Produtos e serviços, Fornecedores, Usuários, Perfis e permissões, Faturamento, Centros de custo).

The prototype's separate "Mobile - X" phone-frame mockups and export-only files (`Home-print`, `Relatórios - Standalone`, the PPTX deck) were not ported as distinct pages — instead, every page here is responsive.
