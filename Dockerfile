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

# Symlink monorepo node_modules into the built server — avoids a second full npm install
RUN ln -s /app/node_modules /app/apps/backend/.medusa/server/node_modules

EXPOSE 9000

CMD ["sh", "-c", "cd apps/backend/.medusa/server && npm start"]
