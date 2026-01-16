# Stage 1: Build UI
FROM node:20-alpine AS ui-build
WORKDIR /app/ui
COPY ui/package*.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build -- --configuration production

# Stage 2: Build Docs
FROM node:20-alpine AS docs-build
WORKDIR /app/docs
COPY docs/package*.json ./
RUN npm install
COPY docs/ ./
RUN npm run docs:build

# Stage 3: Build Backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN apk add --no-cache openssl
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# Stage 4: Runtime
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=backend-build /app/backend/package*.json ./
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma

# Copy UI build
COPY --from=ui-build /app/ui/dist /app/ui/dist

# Copy Docs build
COPY --from=docs-build /app/docs/.vitepress/dist /app/docs/dist

EXPOSE 8080
CMD ["/bin/sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
