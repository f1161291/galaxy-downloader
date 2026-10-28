# galaxy-downloader Docker 本地部署说明

本目录下新增了 3 个文件用于 Docker 部署：

- `Dockerfile` —— 多阶段构建，运行镜像基于 `node:22-alpine`（轻量）
- `.dockerignore` —— 构建上下文忽略项
- `docker-compose.yml` —— 一键编排

## 前置条件

本机需安装 Docker（含 Docker Compose，Docker Desktop 自带）。

## 方式一：docker compose（推荐）

在项目根目录执行：

```bash
docker compose up -d --build
```

启动后访问：<http://localhost:3010>

## 方式二：docker build + run

```bash
docker build -t galaxy-downloader .
docker run -d --name galaxy-downloader -p 3010:3010 --restart unless-stopped galaxy-downloader
```

## 常用命令

```bash
docker compose logs -f        # 查看日志
docker compose down           # 停止并删除容器
docker compose up -d --build  # 重新构建并启动（源码更新后）
```

## 关于端口

容器内服务监听 `3010`（环境变量 `PORT` 控制），映射到宿主机 `3010`。
如需换端口，改 docker-compose.yml 里的 `"3010:3010"`（宿主机端口）即可。

## 可选环境变量

- `NEXT_PUBLIC_API_BASE_URL`：公开下载 API 地址（本地默认不需要）
- `NEXT_PUBLIC_SITE_URL`：站点地址（默认 http://localhost:3010）
- `SEO_INDEXABLE`：是否允许被搜索引擎索引（`true` / `false`）

## 说明与验证

- 本项目为 Cloudflare Worker 导向，但 `pnpm start`（`vinext start`）用的是纯 Node 生产服务器，
  运行时**不需要** workerd / wrangler，因此运行镜像很轻。
- 已在本机验证：`pnpm build` 成功产出 `dist/`；`vinext start` 正常启动并返回首页 200。
  注意：本项目的 vinext 静态文件缓存存在一个 **Windows 路径分隔符 bug**（`path.relative` 产生 `\`），
  导致 Windows 本机下 `/assets/*`、`/ffmpeg-core/*` 静态资源 404；该问题仅在 Windows 出现，
  Linux / Docker 下 `path.relative` 返回 `/`，静态资源可正常服务，不影响本 Dockerfile。
- 版权提示：本项目使用自定义个人使用许可，Docker 部署仅限**个人非商业**使用，请遵守 LICENSE 条款。
