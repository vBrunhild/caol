FROM python:3.13-slim AS migration
COPY migrate/ /migrate/
WORKDIR /migrate
RUN python migrate.py

FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN pnpm install --frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=backend --prod /prod/backend
RUN pnpm deploy --filter=frontend --prod /prod/frontend

FROM base AS backend
COPY --from=build /prod/backend /prod/backend
COPY --from=migration /migrate/caol.db /prod/backend/caol.db
WORKDIR /prod/backend
ENV DB_PATH=/prod/backend/caol.db
EXPOSE 3000
CMD ["node", "dist/index.js"]

FROM nginx:alpine AS frontend
COPY --from=build /prod/frontend/dist /usr/share/nginx/html
COPY --from=build /usr/src/app/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3001
CMD ["nginx", "-g", "daemon off;"]
