# Stage 1: install everything and compile TypeScript to dist/
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: a small image with only production dependencies and compiled code
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY drizzle ./drizzle
USER node
EXPOSE 4000
# Bring the database schema up to date, then start the server.
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/server.js"]
