# Copilot Instructions for Exaroton Servers Manager

## Project Overview
A Next.js 16 + TypeScript web app for managing Minecraft servers hosted on Exaroton. Uses Firebase for auth/database and integrates with the Exaroton API.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives) in `components/ui/`
- **Backend**: Next.js API Routes (`app/api/`)
- **Auth**: Firebase Authentication (Google OAuth)
- **Database**: Firestore (users, serverCache, actionLogs, creditSnapshots)
- **External API**: Exaroton API for server control

### Key Data Flow
1. Client authenticates via Firebase Auth → gets JWT token
2. API routes verify token with `adminAuth().verifyIdToken(token)`
3. User permissions checked in Firestore (`users` collection)
4. Server operations go through `lib/exaroton.ts` → Exaroton API
5. Results cached in Firestore `serverCache` collection (5-minute TTL)

### Permission Model
- **Admin**: Full access to all servers, can manage users/permissions
- **User**: Access only to servers in their `serverAccess[]` array
- Users can only stop servers when no players are online

## Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Code Patterns

### API Route Authentication Pattern
All API routes must verify Firebase tokens. Follow this pattern from `app/api/servers/route.ts`:
```typescript
const authHeader = request.headers.get('authorization');
const token = authHeader?.split('Bearer ')[1];
const decodedToken = await adminAuth().verifyIdToken(token);
const userDoc = await adminDb().collection('users').doc(decodedToken.uid).get();
```

### Client Components
- Use `'use client'` directive for interactive components
- Auth state via `useAuth()` hook from `lib/auth-context.tsx`
- Translations via `useTranslations('namespace')` from `next-intl`

### Internationalization (i18n)
- Supported locales: `pt-BR` (default), `en`
- Translation files: `messages/pt-BR.json`, `messages/en.json`
- Config: `lib/i18n.ts`
- Use nested keys: `t('servers.status.online')` not flat strings

### UI Components (shadcn/ui)
Add new components via CLI:
```bash
npx shadcn@latest add [component-name]
```
Components use `cn()` utility from `lib/utils.ts` for class merging.

### Action Logging
Log user actions using `logAction()` from `lib/action-logger.ts`:
```typescript
await logAction({
  type: 'server_start',
  userId, userName, userEmail,
  serverId, serverName,
});
```

### Cache Pattern
Server data is cached in Firestore. After mutations (start/stop/restart):
1. Call `invalidateServerCache(serverId)` from `lib/firebase-admin.ts`
2. Frontend waits ~2s then refetches with `?forceRefresh=true`

## File Organization

| Path | Purpose |
|------|---------|
| `app/api/` | API routes (servers, users, credits, history) |
| `app/dashboard/` | Main user dashboard |
| `app/admin/` | Admin panel for user management |
| `app/servers/[id]/` | Individual server details page |
| `components/` | React components |
| `components/ui/` | shadcn/ui primitives |
| `lib/` | Utilities, Firebase config, auth context |
| `types/` | TypeScript type definitions |
| `messages/` | i18n translation files |
| `docs/` | Architecture and feature documentation |

## Environment Variables
Required in `.env`:
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client config
- `FIREBASE_ADMIN_*` - Firebase Admin SDK credentials
- `EXAROTON_API_KEY` - Exaroton API key
- `CRON_SECRET_KEY` - (optional) For auto-snapshot cron jobs

## Deployment (Vercel)

### Setup
1. Import project from GitHub to [Vercel](https://vercel.com)
2. Configure all environment variables from `.env`
3. Deploy!

### Cron Jobs for Credit Snapshots
Add to `vercel.json` for automatic credit tracking:
```json
{
  "crons": [{
    "path": "/api/credits/auto-snapshot",
    "schedule": "0 */6 * * *"
  }]
}
```
Requires `CRON_SECRET_KEY` env var and `X-API-Key` header validation.

## Admin Scripts
Utility scripts in `scripts/` for Firebase administration:

```bash
# List all users and their admin status
node scripts/list-users.js

# Promote a user to admin
node scripts/set-admin.js <user-email>
```
Scripts require `.env.local` with Firebase Admin credentials.

## Project Tracking
- **TODO.md**: Track bugs, improvements, and tasks with timestamps
- Update this file when discovering issues or planning features

## Important Conventions
1. **Types**: Define in `types/index.ts`, import as `@/types`
2. **Path aliases**: Use `@/` for imports (configured in `tsconfig.json`)
3. **Error handling**: Return `NextResponse.json({ error: message }, { status: code })`
4. **PWA**: App is a PWA - manifest at `public/manifest.json`
5. **Firestore rules**: Security rules in `firestore.rules` - API routes handle auth server-side

## Folders to Ignore
- `dataconnect/`, `src/dataconnect-*/` - Firebase Data Connect (not actively used, can be removed)
