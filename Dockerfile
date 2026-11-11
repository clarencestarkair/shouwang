# 守望 · 生产镜像（多阶段构建，最终镜像只包含 standalone 产物）
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
