# Apple Podcasts 多集支持验收清单

## 当前状态

2026-10-10：实现与文案已核对，音频分享链接补齐 `type=audio`；完成真实接口和本地浏览器验收，并补充 Podcast 回归用例。未勾选项保留实际未通过或未执行的验证。

## 目标

在通用下载器中支持 Apple Podcasts：

- 节目主页链接解析为可搜索、可选择的单集列表。
- 选择单集后可以播放并下载该集的公开音频文件。
- 带 `?i=<episodeId>` 的明确单集链接仍按单个音频结果展示。
- 历史记录、平台支持说明和多语言文案正确显示 Apple Podcasts。

测试节目：

```text
https://podcasts.apple.com/tw/podcast/%E9%8C%A2%E5%BE%80%E5%93%AA%E8%A3%A1%E6%B5%81/id1888765575
```

## 范围边界

- 仅支持 Apple Podcasts 中可以公开访问的音频。
- 不绕过付费、订阅、地区限制、登录或 DRM。
- 不下载节目全集压缩包，用户逐集选择和下载。
- 不将 Podcast 单集伪装为视频条目，不提供音频提取操作。
- 不改变其他平台现有的分 P、合集和单媒体行为。

## 后端接口契约

前端以 `bhwa233-download-api` 已提供的统一接口为准。

### 节目主页

节目包含多个公开单集时，前端解析接口 `/api/parse?url=<showUrl>` 返回：

```text
kind: "picker"
type: "audio"
platform: "apple_podcasts"
currentItemId: <默认单集 ID>
currentEpisodeId: <默认单集 ID>
items: <单集列表>
episodes: <单集列表>
```

单集列表按发布时间从新到旧排列。每项至少包含：

```text
id
title
cover
duration
releaseDate
downloadUrl 或 downloadAudioUrl
originDownloadAudioUrl（可选）
```

播放和下载指定单集时必须传递：

```text
item=<episodeId>
```

前端使用 `episodes` 和 `downloadAudioUrl`；`items` 和 `downloadUrl` 是后端同时返回的兼容别名。明确单集响应也可能包含 `episodes`，界面应以 `kind: "audio"` 优先。

### 明确单集链接

带 `?i=<episodeId>` 的 Apple Podcasts URL 返回 `kind: "audio"`。前端只展示该单集的播放器和下载操作，不展示多集选择器。

## 实现清单

### 1. 类型与平台识别

- [x] 在 `src/lib/types.ts` 新增 Podcast 单集类型。
- [x] 为统一结果补充前端使用的 `kind`、`episodes` 和 `currentEpisodeId`。
- [x] 将 `apple_podcasts` 加入平台类型。
- [x] 在 `src/lib/platforms.ts` 添加 `apple_podcasts` 规范平台名映射。
- [x] 为历史记录返回 `Apple Podcasts` 标签。
- [x] 不把 Apple Podcasts 加入浏览器音频提取平台集合，因为后端直接提供音频。

### 2. 单集选择组件

- [x] 新增 `PodcastEpisodeList.tsx`，使用纯音频语义。
- [x] 显示单集序号、标题、时长和发布日期。
- [x] 支持按标题搜索。
- [x] 高亮当前单集，并将初始列表滚动到后端指定的默认单集。
- [x] 提供“播放音频/选择”操作。
- [x] 提供每集独立的音频下载操作。
- [x] 移动端按现有分批列表模式加载更多和收起。
- [x] 使用现有 shadcn 组件、Lucide 图标和下载状态 Hook。
- [x] 保证按钮尺寸稳定、长标题截断且桌面端和移动端不重叠。

### 3. 结果卡片联动

- [x] 在 `ResultCard.tsx` 中识别 `kind === "picker"` 的 Podcast 结果。
- [x] 默认选择 `currentEpisodeId`，其次使用 `currentItemId`，最后回退到列表第一项。
- [x] 选中单集后同步更新标题、封面、时长和下载地址。
- [x] 音频预览请求携带 `item=<episodeId>`。
- [x] 下载请求携带 `item=<episodeId>`。
- [x] 分享播放链接保留节目来源 URL，并在播放请求中保留当前单集 ID。
- [x] `kind === "audio"` 的明确单集结果继续使用现有单音频界面。
- [x] 避免用额外 Effect 复制可推导状态，尽量从结果和选中 ID 派生展示数据。

### 4. 播放辅助逻辑

- [x] 在 `media-preview.ts` 新增 Podcast 单集预览构造逻辑。
- [x] 仅在存在可用音频地址时允许预览。
- [x] 验证生成的 `/api/play` URL 同时包含 `type=audio` 和正确的 `item`。

### 5. 平台说明与多语言

- [x] 在 `platform-support.ts` 增加 Apple Podcasts 项目和图标配置。
- [x] 在 `public/platform-icons/` 添加与现有资源风格一致的 Apple Podcasts 图标。
- [x] 更新简体中文、繁体中文、英文、日文、西班牙文和俄文词典。
- [x] 增加单集列表、单集数量、搜索占位、无搜索结果等界面文案。
- [x] 增加平台名称、功能、限制和示例链接说明。
- [x] 更新各语言 SEO 功能描述，准确表述为公开 Podcast 音频下载。
- [x] 更新 `src/lib/i18n/types.ts`，验证六份词典的 Podcast 文案字段和数量占位符完整。
- [x] 更新 README 的平台列表、功能特点、支持链接格式和限制说明。

## 测试清单

### 自动测试与浏览器回归

自动测试覆盖默认单集优先级、指定单集播放 URL、明确单集界面和既有视频/音频分派；切换、搜索与下载使用真实 API 在本地浏览器验收。

- [x] 平台归一化：`apple_podcasts` 不再变成 `unknown`。
- [x] 历史记录标签：显示 `Apple Podcasts`。
- [x] 平台支持列表：包含 Apple Podcasts。
- [x] 节目主页 picker：默认高亮 `currentEpisodeId`。
- [x] 选择不同单集：标题、播放器和下载地址切换到对应 ID。
- [x] 播放 URL：包含正确的 `item=<episodeId>`。
- [x] 单集搜索：按标题过滤并支持无结果状态。
- [x] 明确单集 URL：不渲染多集列表。
- [x] 回归：Bilibili 分 P、合集、SoundCloud 单音频结果行为不变。

### 命令验证

- [ ] `pnpm test`：88 项通过、1 项既有失败；`tests/parse-stats.test.ts` 的成功响应数据缺少必需的 `totalCount`。
- [x] `pnpm build`
- [x] `pnpm lint`
- [ ] `pnpm exec tsc --noEmit --incremental false`：`src/lib/ffmpeg.ts:100-101` 有两处既有 `string | null` 类型错误；本次改动无新增类型错误。

### 手动验收

- [x] 使用测试节目确认返回的单集按新到旧排列。
- [x] 默认选中最新一集，并可正常播放、下载。
- [x] 切换到另一集后，播放器和下载文件均对应所选单集。
- [x] 使用带 `?i=` 的单集链接确认只显示单音频结果。
- [x] 在桌面和移动视口检查搜索、滚动、长标题和操作按钮布局。
- [x] 验证公开音频可下载：指定单集返回 `206 audio/mpeg` 和对应的 MP3 附件文件名。
- [ ] 使用真实付费或受限单集验证错误提示；本次没有此类样本。

验收记录：测试节目返回 5 集，按发布时间从新到旧排列，默认 ID 为 `1000761282538`。切换到 `1000759496426` 后，播放器、下载和分享均保持该 ID；分享页可加载音频，明确单集链接不显示多集选择器。桌面 1280×900、移动端 390×844 检查长标题及按钮布局；205 集本地模拟数据验证移动端按 100 → 200 → 205 集加载并收起至 100 集。

## 完成标准

- Apple Podcasts 节目主页可以稳定选择、播放和逐集下载公开音频。
- 明确单集链接保持单音频体验。
- 平台名称、帮助说明、README 和六种语言文案一致。
- 新增与相关测试通过，生产构建成功；全量测试和类型检查的既有失败另行处理。
