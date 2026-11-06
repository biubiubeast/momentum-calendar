# 有序 Momentum

日历、执行进度、专注计时与习惯记录工具。公司服务器地址：<https://bill.spailab.com/Momentum/>。

## 公司服务器运行方式

`main` 是 Ubuntu 自托管版本，使用 Next.js、Node.js 22.13+、SQLite 与独立账号登录。原 Sites/Cloudflare 源码和迁移结构保留作参考，生产运行不依赖 Sites 身份头、D1 或 Wrangler。

- 源码：`/home/bill/projects/momentum-calendar`
- 发布：`/home/bill/apps/momentum/releases/`，`current` 指向正在使用的版本
- 数据库：`/home/bill/.local/share/momentum/app.sqlite`
- 配置：`/home/bill/.config/momentum/runtime.json`
- 自动备份：`/home/bill/apps/momentum/backups/`
- PM2 服务：`momentum`，仅监听 `127.0.0.1:3105`；候选版本临时使用 3106
- Caddy 保留 `/Momentum` 前缀后转发；`/Momentum` 重定向到 `/Momentum/`

账号密码使用独立盐和 PBKDF2-SHA256 哈希；会话在服务端保存，Cookie 为 HttpOnly、Secure、SameSite=Lax，有效期 8 小时。不同账号按服务端身份隔离记录。保存有修订号冲突检查，旧页面不会覆盖更新后的记录。

## 日常更新（在 Termius 的 bill@jpnode4 中执行）

先把 Codex 或其他地方修改后的代码提交并推送到 GitHub 的 `main`，然后：

```sh
cd /home/bill/projects/momentum-calendar
bash ubuntu/deploy.sh
```

脚本只接受干净的 `main` 工作区，并使用 `git pull --ff-only`。它在独立目录安装锁定依赖、运行单元测试、类型检查、生产构建及真实 HTTP 集成测试；备份数据库，再检查候选服务。通过后才切换版本、重启 `momentum` 并保存 PM2 状态。新服务检查失败时恢复上一应用版本；数据库不自动回退，以保留最新记录。

更新保留账号、密码和个人记录。失败时不要执行 `git reset --hard`、删除数据库或反复输入配置命令；根据终端错误处理。更新默认不需要重新加载 Caddy。

```sh
pm2 status
pm2 logs momentum --lines 40 --nostream
node ubuntu/healthcheck.mjs https://bill.spailab.com
```

自动数据库备份保留历史版本，需要定期检查磁盘空间。备份含记录和密码哈希，必须保持私有，不能上传到公开仓库。

## 首次安装

服务器需已有 Git、Node.js 22.13+、npm、PM2、tar、flock，以及公司 Caddy 路由管理权限。

```sh
git clone https://github.com/biubiubeast/momentum-calendar.git /home/bill/projects/momentum-calendar
cd /home/bill/projects/momentum-calendar
node ubuntu/configure.mjs
```

在终端两次输入至少 12 个字符的密码，不会回显。默认账号 `bill`。看到 `Saved server configuration` 后运行部署脚本。配置命令不会覆盖已有配置或重置账号。运行 `node ubuntu/user.mjs anothername` 可以为另一用户创建独立账号，密码同样在终端输入。

Caddy 站点内、默认静态文件路由之前加入（先备份并验证配置，再使用公司的 reload 流程）：

```caddyfile
redir /Momentum /Momentum/ 308
handle /Momentum/* {
    reverse_proxy 127.0.0.1:3105 {
        header_up CF-Connecting-IP {remote_host}
    }
}
```

不要使用 `handle_path` 去掉前缀。数据库和配置均位于 Git 之外。PM2 应使用当前服务器已有的开机启动配置；首次部署后需确认其 systemd 服务已启用。

## 导入原有 JSON 备份

登录新站后，打开「偏好与数据设置」→「备份与导出」，选择完整 JSON 备份恢复。恢复会替换当前账号的记录；导入前建议先导出当前备份。等待保存成功，再刷新确认日历、习惯和统计。原站的数据不会自动同步到新站。

JSON 保留任务、分类、假期、习惯和目标。通知需要页面打开并获得浏览器许可；关闭网页后的提醒请导出 ICS 到系统日历。ICS 支持 UTC、香港和上海时区；无时区按香港处理。全天事件安排到 09:00–10:00；重复规则和一般跨日事件不展开，相同 UID 在界面导入时去重。

## 开发与验证

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run test:integration
```

集成测试使用临时数据库和随机测试密码，验证真实生产服务的登录、账号隔离、JSON 恢复、保存冲突、来源检查、大小限制、重启持久化和退出失效，不会读取生产配置。预览可使用独立的 `MOMENTUM_CONFIG` 文件配置数据库与地址后执行 `npm start`；不要在开发中连接生产数据库。

公开仓库不包含个人记录、凭据、数据库、备份、构建产物或原 Sites 项目标识。第三方许可保留在 `vendor/` 和 `scripts/vite/`。
