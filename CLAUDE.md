# CLAUDE.md — KYC Monaco (kyc.mc)

## Projet

Plateforme SaaS KYC/AML + mini-CRM relationnel pour les entités réglementées de Monaco.
Conformité AMSF (Loi n° 1.362), objectif validation gouvernementale.
IA Claude (Opus 4 / Sonnet 4) pour automatiser 80% du processus KYC.

**Stack:** TypeScript strict · Next.js 15 (App Router) · Supabase (PostgreSQL + Auth + Storage + Edge Functions) · Drizzle ORM · shadcn/ui · Vercel

## Architecture

Monorepo simplifié (pas de Turborepo — tout dans une app Next.js déployée sur Vercel) :
```
src/
  app/            — Next.js 15 App Router (pages, layouts, server actions)
  components/     — Composants React (ui/, features/, layout/)
  lib/            — Logique métier, services, utils
    supabase/     — Client Supabase, helpers, RLS policies
    ai/           — SDK wrapper Claude API + définitions agents
    compliance/   — Règles AMSF, listes sanctions, templates rapports
    validation/   — Schémas Zod partagés
  types/          — Types TypeScript partagés
supabase/
  migrations/     — Migrations SQL (supabase db push)
  functions/      — Supabase Edge Functions (Deno)
  seed.sql        — Données de dev
```

## Infrastructure

- **Frontend + SSR** : Vercel (Next.js 15, App Router, RSC, Server Actions)
- **Backend** : Supabase (PostgreSQL 16, Auth, Storage, Edge Functions, Realtime)
- **ORM** : Drizzle (pour les schemas et queries typées, connecté à Supabase PostgreSQL)
- **Auth** : Supabase Auth (Magic Link + Email/Password, RBAC via custom claims)
- **Storage** : Supabase Storage (documents KYC, avec policies RLS)
- **AI** : Claude API (Anthropic SDK) via Server Actions ou Edge Functions
- **Pas de Docker, pas de serveur local** — tout tourne sur Supabase cloud + Vercel

## Design System (Style Attio)

Le design suit une esthétique **Attio-like** :
- **Fond sombre** : backgrounds `#0a0a0f`, `#12121a`, `#1a1a2e`
- **Typographie** : Inter (UI), JetBrains Mono (code/données)
- **Couleurs accent** : Indigo `#6366f1` principal, Cyan `#06b6d4` secondaire
- **Composants** : Cards avec border subtile, hover states élégants, pas de shadows lourdes
- **Navigation** : Sidebar gauche minimaliste avec icônes Lucide, collapsible
- **Tables** : Style Attio — lignes hover, colonnes redimensionnables, inline editing
- **Animations** : Framer Motion, transitions 200ms ease, pas de bounces
- **Espacements** : Multiples de 4px, padding généreux (16-24px cards)

**Consulte** `.claude/agents/frontend.md` pour les règles complètes du design system.

## Modèle de données : CRM/Entity Graph

Le cœur du produit est un **graphe relationnel** entre entités :
- **People** : Individus (clients, UBOs, PEPs, représentants)
- **Companies** : Sociétés, trusts, fondations, SPVs
- **Relations** : Liens typés entre entités (UBO, director, shareholder, family, associate...)
- **KYC Cases** : Dossiers de vérification attachés à des entités
- **Documents** : Pièces justificatives liées aux entités et aux cases
- **Screenings** : Résultats PEP/sanctions par entité
- **Activities** : Timeline d'événements par entité (style CRM)
- **Notes** : Notes manuelles des compliance officers

Chaque entité a une **fiche détaillée** (style Attio record view) avec :
- Données structurées en colonnes customisables
- Timeline d'activité
- Graphe de relations visuel
- Statut KYC et score de risque
- Documents attachés

## Règles absolues (NEVER break)

### Sécurité
- JAMAIS de données PII en clair dans les logs (masquer SSN, passport, DOB)
- JAMAIS de `console.log` avec des données sensibles
- TOUJOURS RLS activé sur les nouvelles tables (`tenant_id` obligatoire)
- TOUJOURS field-level encryption pour : `passport_number`, `national_id`, `date_of_birth`, `tax_id`, `bank_account`
- TOUJOURS HTTPS, JAMAIS de HTTP même en dev

### Code Quality
- JAMAIS de `any` en TypeScript — mode strict enforced
- TOUJOURS Zod validation sur chaque endpoint/server action (input ET output)
- TOUJOURS audit log pour les actions sensibles (CRUD sur entities, screening, risk decisions)
- TOUJOURS des tests pour chaque nouvelle feature (minimum unit test)
- JAMAIS de magic numbers — utiliser des constantes nommées
- TOUJOURS utiliser les schémas Zod de `src/lib/validation/` (partagés)

### Architecture
- TOUJOURS Server Components par défaut dans Next.js, `"use client"` uniquement si nécessaire
- TOUJOURS Server Actions pour les mutations (pas d'API routes Next.js pour les writes)
- TOUJOURS passer par les Edge Functions Supabase pour les opérations complexes ou multi-step
- JAMAIS d'appels Claude API directement depuis le frontend
- TOUJOURS utiliser les agents IA définis dans `src/lib/ai/agents/` — ne pas créer d'appels Claude ad-hoc
- JAMAIS de logique métier dans les composants React — toujours dans services ou server actions
- TOUJOURS utiliser le client Supabase SSR (`@supabase/ssr`) dans les Server Components/Actions
- TOUJOURS utiliser le client Supabase Browser dans les Client Components

### Multi-tenancy
- TOUJOURS inclure `tenant_id` dans chaque query (même avec RLS activé, defense in depth)
- TOUJOURS RLS policies sur Supabase pour chaque table
- JAMAIS de queries cross-tenant (sauf admin système)

### Conformité AMSF
- TOUJOURS human-in-the-loop pour les décisions finales KYC (approve/reject)
- TOUJOURS stocker la justification de chaque décision
- TOUJOURS conserver l'audit trail pendant 7 ans minimum
- JAMAIS supprimer un audit log (append-only)
- TOUJOURS documenter quand l'IA a participé à une décision

## Commandes

```bash
npm run dev           # Dev server Next.js (localhost:3000)
npm run build         # Build production
npm run lint          # ESLint + Prettier check
npm run typecheck     # TypeScript strict check
npx supabase db push  # Push schema changes
npx supabase db reset # Reset DB + apply migrations + seed
npx supabase gen types typescript --local > src/types/supabase.ts  # Generate types from DB
```

## Conventions

### Git
- **Commits** : Conventional Commits obligatoire
  - `feat:` nouvelle fonctionnalité
  - `fix:` correction de bug
  - `security:` changement lié à la sécurité
  - `compliance:` changement lié à la conformité AMSF
  - `ui:` changement visuel uniquement
  - `perf:` amélioration de performance
  - `refactor:` refactoring sans changement de comportement
- **Branches** : `feature/`, `fix/`, `security/`, `compliance/`, `ui/`

### Nommage
- **Fichiers** : kebab-case (`kyc-case-card.tsx`, `screening-service.ts`)
- **Composants** : PascalCase (`KycCaseCard`, `RiskScoreBadge`)
- **Variables/fonctions** : camelCase (`getRiskScore`, `screeningResult`)
- **Constantes** : UPPER_SNAKE_CASE (`MAX_RISK_SCORE`, `PEP_CATEGORIES`)
- **Types** : PascalCase avec suffixe descriptif (`KycCaseStatus`, `ScreeningResult`)
- **DB tables** : snake_case pluriel (`kyc_cases`, `screening_results`)
- **DB columns** : snake_case (`tenant_id`, `risk_score`)

### Structure des composants React
```tsx
// 1. Imports (externe → interne → types)
import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { KycCase } from "@/types";

// 2. Types locaux
interface Props { kycCase: KycCase; }

// 3. Composant (export default pour pages, named export pour composants)
export function KycCaseCard({ kycCase }: Props) {
  // 4. Hooks en premier
  // 5. Derived state
  // 6. Handlers
  // 7. JSX
}
```

### Supabase Client Pattern
```tsx
// Server Components / Server Actions
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// Client Components
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
```

### API Endpoints (Server Actions + Edge Functions)

Server Actions (mutations simples) :
```
src/app/actions/entities.ts    — CRUD entities
src/app/actions/cases.ts       — CRUD KYC cases
src/app/actions/documents.ts   — Upload/manage documents
src/app/actions/screening.ts   — Run/manage screenings
src/app/actions/decisions.ts   — Submit decisions (human-in-the-loop)
```

Edge Functions (opérations complexes/async) :
```
supabase/functions/ai-extract/     — AI document extraction
supabase/functions/ai-screening/   — AI screening analysis
supabase/functions/ai-risk/        — AI risk computation
supabase/functions/report-generate/ — Generate KYC report PDF
supabase/functions/webhook-sanctions/ — Webhook for sanctions list updates
```

## Agents IA disponibles

Utilise les agents définis dans `.claude/agents/` :
- `architect.md` — Décisions techniques, revue architecture
- `security.md` — Audit sécurité, crypto, RBAC
- `frontend.md` — Design system Attio-like, UX, composants
- `backend.md` — API, DB, services, intégrations
- `compliance.md` — Règles AMSF, conformité, audit

## Context important

- Monaco est sur la liste grise du GAFI depuis juin 2024
- L'AMSF (Autorité Monégasque de Sécurité Financière) est le régulateur
- La Loi n° 1.362 est la base légale LCB-FT
- Les guides pratiques AMSF 2025 définissent les standards de conformité
- L'objectif est de faire valider la plateforme par le gouvernement monégasque
- Le produit doit supporter le français ET l'anglais (i18n obligatoire)
