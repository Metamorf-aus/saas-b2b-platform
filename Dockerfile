FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy entire monorepo
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the backend (medusa build → apps/backend/.medusa/server/)
RUN pnpm --filter @b2b-starter/backend build

EXPOSE 9000

# Run via pnpm so the monorepo node_modules are used (avoids a second npm install)
CMD ["sh", "-c", "cd apps/backend && pnpm start"]
