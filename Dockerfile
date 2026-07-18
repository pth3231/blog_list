# syntax=docker/dockerfile:1

# Multi-stage build that produces a single production image. In production the
# backend serves the built SPA (single origin), so one image carries both.
# Note: pin `node:24-slim` to a digest for strict reproducibility in real prod.

# ---- Stage 1: build the frontend (Vite SPA -> static assets) ----
FROM node:24-slim AS frontend-build
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: compile the backend (TypeScript -> dist/) ----
FROM node:24-slim AS backend-build
WORKDIR /build/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# ---- Stage 3: runtime (production deps only, non-root) ----
FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Install only runtime dependencies (no tsc / eslint / vitest in the image)
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled backend, built frontend (served via FRONTEND_DIST), and the probe
COPY --from=backend-build /build/backend/dist ./dist
COPY --from=frontend-build /build/frontend/dist ./frontend-dist
COPY docker-healthcheck.mjs ./docker-healthcheck.mjs

ENV PORT=3000 \
    FRONTEND_DIST=/app/frontend-dist
EXPOSE 3000

# Readiness = HTTP 200 from /health/ready (API up AND MongoDB connected)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["node", "docker-healthcheck.mjs"]

USER node
CMD ["node", "dist/server.js"]
