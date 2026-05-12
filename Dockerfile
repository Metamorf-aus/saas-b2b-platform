FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy entire monorepo
COPY . .

# Install all dependencies (populates pnpm store)
RUN pnpm install --frozen-lockfile

# Build the backend (medusa build → apps/backend/.medusa/server/)
RUN pnpm --filter @b2b-starter/backend build

# Install production deps in the built server.
# pnpm reuses packages already in its store from the step above — no re-download.
RUN cd apps/backend/.medusa/server && pnpm install --prod --no-lockfile

EXPOSE 9000

# Create admin user from env vars (silently skips if already exists), then start server
CMD ["sh", "-c", "cd /app/apps/backend && pnpm medusa exec ./src/migration-scripts/create-admin-user.ts && cd /app/apps/backend/.medusa/server && npm start"]
