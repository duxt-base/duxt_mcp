# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production=false

COPY tsconfig.json ./
COPY src/ ./src/

RUN npx tsc

# Runtime stage
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY --from=build /app/dist ./dist
COPY docs/ ./docs/

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
