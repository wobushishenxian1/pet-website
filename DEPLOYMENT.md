# 金沐宠物洗护 Cloudflare 上线说明

这个项目分两种运行模式：

- 本地预览：`file://`、`localhost`、`127.0.0.1` 会使用浏览器 `localStorage` 保存预约数据，方便演示和调试。
- Cloudflare 线上：前台通过 Pages Functions 调用真实 API，预约数据写入 D1，后台登录使用 HttpOnly session cookie。

## 本地预览

在项目目录运行：

```bash
node local-preview-server.js
```

然后访问：

- 前台：`http://127.0.0.1:8080/`
- 后台：`http://127.0.0.1:8080/admin/index.html`

本地后台登录密码是 `demo123`。本地预约和登录状态都存在当前浏览器里，清除站点数据会删除这些本地演示数据。

## Cloudflare 上线步骤

### 1. 创建 D1 数据库

在 Cloudflare 控制台创建一个 D1 数据库，建议名称为：

```text
goldenwash
```

创建后复制数据库 ID，替换 `wrangler.toml` 里的：

```toml
database_id = "replace-with-your-d1-database-id"
```

绑定名称必须保持为：

```toml
binding = "DB"
```

### 2. 设置线上环境变量

在 Cloudflare Pages 项目的环境变量里添加：

```text
ADMIN_PASSWORD
SESSION_SECRET
```

建议：

- `ADMIN_PASSWORD` 使用你自己记得住、别人猜不到的后台密码。
- `SESSION_SECRET` 使用一串足够长的随机字符串。
- 不要把真实密码或密钥写进 `wrangler.toml`、HTML、JS 或 GitHub 仓库。

### 3. 执行 D1 migration

在绑定好 D1 后，执行：

```bash
wrangler d1 migrations apply goldenwash --remote
```

这会运行 `migrations/0001_init.sql`，创建 `bookings` 表和预约时段唯一索引。

### 4. 部署 Cloudflare Pages

如果使用 Cloudflare 控制台连接 GitHub 仓库：

- Framework preset 选择 `None` 或静态站点。
- Build command 留空。
- Build output directory 使用项目根目录。
- 确认 Functions 目录为 `functions`。
- 确认 D1 绑定名为 `DB`。

如果使用 Wrangler 部署，可在项目目录运行：

```bash
wrangler pages deploy .
```

### 5. 上线后验证

前台验证：

- 打开线上域名。
- 选择今天或未来日期。
- 选择可预约时间。
- 填写姓名、手机号、宠物类型和服务项目。
- 提交后看到：`预约申请已提交，门店会尽快确认。`

后台验证：

- 打开：`https://你的域名/admin/`
- 使用 `ADMIN_PASSWORD` 登录。
- 能看到刚提交的预约。
- 修改状态或后台备注后保存。

冲突验证：

- 同一天同一时段第一次预约应成功。
- 第二次预约同一时段应提示该时段已被预约。
- 后台把该预约改为 `已取消` 后，这个时段应重新可预约。

## 清除数据会发生什么

- 本地清除站点数据：会清掉本地演示预约和本地演示登录。
- 线上清除 cookie：只会退出后台登录，不会删除 D1 里的预约。
- 线上清除缓存：不会删除 D1 里的预约。

