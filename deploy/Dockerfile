# Builds the son's game inside a container and serves only the finished static files.
# Nothing from his package.json runs on the host, and the running container has no Node in it.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci uses the lockfile exactly; --ignore-scripts blocks every package install hook.
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npx vite build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/docs /usr/share/nginx/html/docs
COPY --from=deploy nginx.conf /etc/nginx/conf.d/default.conf
