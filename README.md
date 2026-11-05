# 有序 Momentum

以日历为主页的执行力与习惯记录工具。规划每天 1–2 小时的行动时间块，记录进度与实际投入，长期观察完成率和专注时长变化。

## 功能

- 日、周、月日历，时间块新增、编辑、分类筛选与重复安排。
- 日、周、月、年完成率和正事专注时长统计，专注趋势与时间分布。
- 专注计时、习惯打卡、连续行动反馈。
- 香港 2026／2027 公众假期、大陆 2026 放假与调休导入。
- ICS 未来事件与提醒导入、带闹钟的日历导出、JSON 完整备份恢复。
- 用户记录保存到服务端，按登录账号隔离。

## 当前运行方式

此仓库是现有 Sites 版本的源码快照，采用 React、TypeScript、Vinext、Cloudflare Workers、D1 和 Drizzle。数据 API 在 `app/api/state/route.ts`；记录格式和统计逻辑在 `app/model.ts`。

**当前源码尚未完成公司服务器的自托管适配。** 公开 GitHub 仓库只公开代码；不代表已经部署到公司域名，也不公开原站点的访问权限或用户记录。

## 本地开发

使用 Node.js 24 LTS 与 npm。

```sh
npm ci
npm run db:generate
npm run build
```

数据库初始迁移已包含在仓库中。首次本地预览，在构建后应用它：

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_needy_ezekiel.sql
npm run dev
```

按终端输出打开本地地址。仅本地开发提供模拟登录，路径是 `/signin-with-chatgpt?return_to=/`；生产登录原本由 Sites 托管。

```sh
npx tsc --noEmit
npm run build
```

`npm start` 使用 Wrangler 运行构建后的本地 Worker，不是公司服务器的生产启动命令。

## 公司服务器迁移目标

目标地址：`https://bill.spailab.com/Momentum`。

迁移时需要完成：

1. 使用公司 Git／CI/CD 流程发布，确认 Node.js 或容器运行环境。
2. 将 Cloudflare D1 数据访问替换为公司数据库或适当的持久化存储，并保留修订号冲突检查。
3. 将 Sites 身份验证替换为公司认可的登录体系，按服务端认证身份隔离用户数据。
4. 为页面、接口、图标、登录跳转统一配置 `/Momentum` 前缀，并接入公司反向代理。
5. 配置数据库迁移、备份与健康检查，验证登录、保存、刷新恢复及统计。
6. 从原站点导出 JSON 完整备份，在新站点登录后恢复并核对记录。

公司 CI/CD、服务器凭据和数据库连接信息应通过部署平台的密钥配置提供，不放进源码。

## 提醒与导入范围

网页通知需要页面保持打开并获得浏览器通知许可。关闭网页后的闹钟请将 ICS 导入系统日历，由系统日历负责送达。

ICS 支持 UTC、香港和上海时区；无时区事件按香港时间处理。全天事件安排为 09:00–10:00；暂不展开重复规则和一般跨日事件，次日零点结束的事件可导入。相同 UID 自动去重。

## 公开内容范围

此快照包含应用代码、数据库结构、锁定依赖和第三方许可；不包含 Git 历史、个人行动记录、数据库文件、凭据、本地缓存、构建产物或原站点项目标识。演示任务来自代码生成的示例数据。

第三方许可保留在 `vendor/` 和 `scripts/vite/`。
