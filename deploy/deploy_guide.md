# 锦绣古镇：汉服织造录 部署文档

## 一、前端部署（已完成）

### 部署状态
- ✅ 已成功部署至: https://ez5hcxs6shbpe.ok.kimi.link
- 平台: 静态网站托管
- 构建工具: Vite + React + TypeScript

### 前端文件结构
```
dist/
├── index.html              # 入口文件
├── assets/
│   ├── index-[hash].js    # 游戏主逻辑
│   ├── index-[hash].css   # 游戏样式
│   └── scenes/            # 场景背景图（7张）
│   └── characters/        # 角色立绘（8张）
└── config/
    └── json/              # 游戏配置JSON
```

## 二、后端部署

### 1. Docker部署（推荐）
```bash
cd /mnt/agents/output/deploy
docker build -t jinxiu-game-server .
docker run -d -p 3000:3000 --name jinxiu-server jinxiu-game-server
```

### 2. 直接部署
```bash
cd /mnt/agents/output/server
npm install
npm start
```

### 3. Nginx反向代理配置
```nginx
server {
    listen 80;
    server_name game.xxx.com;
    
    location / {
        root /var/www/jinxiu-game/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 三、数据库初始化

### MySQL建表脚本
```sql
CREATE DATABASE jinxiu_game DEFAULT CHARSET utf8mb4;

USE jinxiu_game;

CREATE TABLE users (
    user_id VARCHAR(32) PRIMARY KEY,
    token VARCHAR(64) NOT NULL,
    user_name VARCHAR(32) DEFAULT '沈绾',
    level INT DEFAULT 1,
    energy INT DEFAULT 50,
    max_energy INT DEFAULT 50,
    coin INT DEFAULT 1000,
    silver INT DEFAULT 100,
    prestige INT DEFAULT 0,
    unlock_scene JSON DEFAULT '[1]',
    cur_scene_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32),
    item_id VARCHAR(16),
    quantity INT DEFAULT 0,
    UNIQUE KEY uk_user_item (user_id, item_id)
);

CREATE TABLE user_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32),
    collection_type INT,
    collection_id INT,
    UNIQUE KEY uk_user_collection (user_id, collection_type, collection_id)
);
```

## 四、环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 3000 |
| DB_HOST | MySQL地址 | localhost |
| DB_PORT | MySQL端口 | 3306 |
| DB_USER | MySQL用户名 | root |
| DB_PASS | MySQL密码 | 空 |
| DB_NAME | 数据库名 | jinxiu_game |
| REDIS_HOST | Redis地址 | localhost |
| REDIS_PORT | Redis端口 | 6379 |
| JWT_SECRET | 签名密钥 | jinxiu-secret |

## 五、上线检查清单

- [ ] 前端构建文件已上传至CDN
- [ ] 后端服务已部署并运行
- [ ] 数据库已初始化
- [ ] Redis已启动
- [ ] Nginx配置已生效
- [ ] SSL证书已配置
- [ ] 域名已解析
- [ ] 广告SDK已接入
- [ ] 支付SDK已接入
- [ ] 监控告警已配置
