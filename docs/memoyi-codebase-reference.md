# Memoyi Codebase Reference (from exploration)

## Key Architecture Points

### Frontend: React Router v7 (NOT Next.js)
- Apps: `apps/web/` (main), `apps/space/` (public), `apps/admin/`
- Vite-based, `react-router dev --port 3000`
- Next.js compat shims in `apps/web/app/compat/` (stubs for `next/link`, `next/navigation`)
- Dual-layer arch: `core/` (aliased as `@/*`) + `ce/` (aliased as `@/plane-web/*`)

### Routes: Defined in `apps/web/app/routes/core.ts`
Pattern:
```typescript
route(":workspaceSlug/analytics", "./.../analytics/page.tsx"),
layout("./.../[projectId]/cycles/(list)/layout.tsx", [
  route(":workspaceSlug/projects/:projectId/cycles", "./.../cycles/(list)/page.tsx"),
])
```

### Sidebar Nav: `packages/constants/src/workspace.ts`
Three arrays: STATIC, PINNED, DYNAMIC (reorderable).
Each item: `{ key, labelTranslationKey, href, access, highlight }`

### Backend: Django + DRF (apps/api/)
Project at `apps/api/plane/`
- `plane/urls.py` routes → `plane.app.urls` (main v2 API), `plane.api.urls` (v1 legacy)
- Apps registered as `"plane.<name>"` in INSTALLED_APPS
- Base classes: `BaseViewSet`, `BaseAPIView`, `BaseSerializer`, `allow_permission` decorator
- Models at `plane/db/models/` — `BaseModel` (UUID pk), `WorkspaceBaseModel`, `ProjectBaseModel`

### Real-time: `apps/live/` (Node.js + Hocuspocus + Redis)
- Standalone service for collaborative document editing
- Not needed for agent event streaming — we'll add a simple WebSocket via Django Channels or a lightweight Node service
- Redis pub/sub already exists for cross-server messaging

### Docker
- Dev: `docker-compose-local.yml` (7 services: db, redis, mq, minio, api, worker, beat-worker)
- Prod: `docker-compose.yml` (11 services including live, web, admin, space, proxy)
- No `live` service in dev mode
