# syntax=docker/dockerfile:1
#
# galaxy-downloader 本地 Docker 部署
# 项目基于 vinext(Next.js App Router) 构建，`pnpm start`(vinext start) 使用纯 Node HTTP 服务器
# 提供 SSR 页面 + 静态资源 + API，运行时无需 workerd / wrangler。
# 采用多阶段构建 + Alpine 轻量运行时。

########## 1. 构建阶段 ##########
FROM node:22-alpine AS builder

# 证书 + 启用 pnpm（版本由 package.json 的 packageManager 字段锁定为 11.8.0）
RUN apk add --no-cache ca-certificates \
    && corepack enable \
    && corepack prepare pnpm@11.8.0 --activate

WORKDIR /build

# 先只复制依赖清单，最大化利用 Docker 层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 安装依赖（严格锁定版本，避免差异）
RUN pnpm install --frozen-lockfile

# 复制全部源码并生产构建
# 构建内部依次执行 prepare:ffmpeg-core（把 ffmpeg wasm 拷入 public/）与 vinext build（产出 dist/）
COPY . .

RUN pnpm build

########## 2. 运行阶段（轻量运行时） ##########
FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    PORT=3010

WORKDIR /app

# 证书 + 启用 pnpm（版本由 package.json 的 packageManager 字段锁定为 11.8.0）
RUN apk add --no-cache ca-certificates \
    && corepack enable \
    && corepack prepare pnpm@11.8.0 --activate

# 只安装生产依赖（--prod），不再整包复制含全部 devDependencies 的 node_modules，
# 镜像体积从 ~800MB 精简到 ~580MB（约 -27%）。运行时服务器 vinext 及其所需
# 的 vite / @vitejs/plugin-react / @vitejs/plugin-rsc / react-server-dom-webpack
# 已移入 package.json 的 dependencies，因此 --prod 安装后 vinext start 可正常运行。
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 复制生产构建产物（vinext start 运行时只读 dist/server 的 manifest）
COPY --from=builder /build/dist ./dist

# 非 root 运行，更安全
RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app /app
USER app

EXPOSE 3010

# 健康检查：向服务端口发起请求
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3010)).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# 直接调用 vinext CLI 启动生产服务器（等价于 pnpm start）
CMD ["node", "node_modules/vinext/dist/cli.js", "start"]
