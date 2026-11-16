FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies first for layer caching. .env.example is required because
# the postinstall hook seeds .env from it.
COPY package.json package-lock.json .env.example ./
RUN npm ci

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN npm run build

FROM nginx:1.27-alpine

# jq is used by the entrypoint to merge runtime env vars into env.json.
RUN apk add --no-cache jq

COPY --from=builder /app/dist /srv/www
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/90-write-env-to-json.sh /docker-entrypoint.d/90-write-env-to-json.sh
RUN chmod +x /docker-entrypoint.d/90-write-env-to-json.sh

EXPOSE 80
