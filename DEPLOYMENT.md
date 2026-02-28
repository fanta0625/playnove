# 启玩星球（PlayNova）部署方案

## 1. Docker化部署

### 1.1 前端Docker配置

```dockerfile
# frontend/Dockerfile
# 多阶段构建：构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理到后端（开发环境）
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 1.2 后端Docker配置

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 生成Prisma Client
RUN npx prisma generate

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "dist/main"]
```

```javascript
// backend/healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 2000,
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.end();
```

### 1.3 Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL数据库
  postgres:
    image: postgres:15-alpine
    container_name: playnova-postgres
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - playnova-network

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: playnova-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - playnova-network

  # 后端API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: playnova-backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - playnova-network
    restart: unless-stopped

  # 前端应用
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: playnova-frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - playnova-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  playnova-network:
    driver: bridge
```

---

## 2. Nginx反向代理配置

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    gzip on;

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name playnova.com www.playnova.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS配置
    server {
        listen 443 ssl http2;
        server_name playnova.com www.playnova.com;

        # SSL证书（使用Let's Encrypt）
        ssl_certificate /etc/letsencrypt/live/playnova.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/playnova.com/privkey.pem;

        # SSL安全配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 安全头
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # 前端静态文件
        location / {
            proxy_pass http://frontend:80;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # API代理到后端
        location /api/ {
            proxy_pass http://backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # 超时配置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # WebSocket支持
        location /ws {
            proxy_pass http://backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # 静态资源缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend:80;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## 3. CDN配置

### 3.1 静态资源CDN

```javascript
// backend/src/common/utils/s3.util.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Util {
  private static client: S3Client;

  static initialize() {
    this.client = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
    });
  }

  /**
   * 上传文件到S3
   */
  static async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1年缓存
    });

    await this.client.send(command);

    // 返回CDN URL
    return `${process.env.CDN_URL}/${key}`;
  }

  /**
   * 生成预签名URL（用于私有文件）
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * 删除文件
   */
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });

    await this.client.send(command);
  }
}
```

### 3.2 前端CDN资源引用

```typescript
// frontend/src/utils/cdn.ts
export const CDN_BASE_URL = import.meta.env.VITE_CDN_URL || '';

export function getCDNUrl(path: string): string {
  return `${CDN_BASE_URL}${path}`;
}

// 使用示例
import { getCDNUrl } from '@/utils/cdn';

const imageUrl = getCDNUrl('/images/games/drag-drop/thumbnail.png');
```

---

## 4. HTTPS配置

### 4.1 使用Let's Encrypt免费证书

```bash
# 安装certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d playnova.com -d www.playnova.com

# 自动续期
sudo certbot renew --dry-run

# 设置定时任务自动续期
sudo crontab -e
# 添加以下行
0 0,12 * * * certbot renew --quiet
```

### 4.2 证书监控

```bash
#!/bin/bash
# scripts/check-ssl.sh

# 检查证书过期时间
DOMAIN="playnova.com"
DAYS_THRESHOLD=30

EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt $DAYS_THRESHOLD ]; then
    echo "WARNING: SSL certificate for $DOMAIN expires in $DAYS_LEFT days!"
    # 发送告警邮件
    # mail -s "SSL Certificate Expiring Soon" admin@playnova.com <<< "The SSL certificate for $DOMAIN will expire in $DAYS_LEFT days."
else
    echo "SSL certificate for $DOMAIN is valid for $DAYS_LEFT more days."
fi
```

---

## 5. 监控与日志

### 5.1 应用监控

```typescript
// backend/src/common/monitoring/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', { heapUsed: 150 * 1024 * 1024 }),
      () => this.memory.checkRSS('memory_rss', { rss: 150 * 1024 * 1024 }),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
```

### 5.2 日志聚合（ELK Stack）

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash/config:/usr/share/logstash/pipeline
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  es_data:
```

---

## 6. 环境变量管理

### 6.1 开发环境

```bash
# .env.development
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# 数据库
DATABASE_URL="postgresql://dev:dev123@localhost:5432/playnova_dev?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""

# JWT
JWT_ACCESS_SECRET="dev-access-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"

# CORS
CORS_ORIGIN="http://localhost:5173"

# S3
S3_ENDPOINT="http://localhost:9000"
S3_BUCKET="playnova-dev"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_REGION="us-east-1"
CDN_URL="http://localhost:9000/playnova-dev"
```

### 6.2 生产环境

```bash
# .env.production
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# 数据库（使用强密码）
DATABASE_URL="postgresql://prod:${DB_PASSWORD}@db.prod.example.com:5432/playnova?schema=public"

# Redis（使用强密码）
REDIS_HOST=redis.prod.example.com
REDIS_PORT=6379
REDIS_PASSWORD="${REDIS_PASSWORD}"

# JWT（使用环境变量注入）
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"

# CORS
CORS_ORIGIN="https://playnova.com,https://www.playnova.com"

# S3（生产环境）
S3_ENDPOINT="https://s3.amazonaws.com"
S3_BUCKET="playnova-prod"
S3_ACCESS_KEY="${S3_ACCESS_KEY}"
S3_SECRET_KEY="${S3_SECRET_KEY}"
S3_REGION="us-east-1"
CDN_URL="https://cdn.playnova.com"

# AI服务
AI_API_KEY="${AI_API_KEY}"
AI_API_URL="https://ai-api.example.com"
```

### 6.3 使用Docker Secrets

```bash
# 创建secrets
echo "your-strong-password" | docker secret create db_password -

# 在docker-compose.yml中使用
services:
  backend:
    environment:
      DATABASE_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    external: true
```

---

## 7. CI/CD流程

### 7.1 GitHub Actions配置

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run tests
        working-directory: ./backend
        run: npm run test
      
      - name: Run linter
        working-directory: ./backend
        run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push Docker images
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker build -t playnova/backend:latest ./backend
          docker build -t playnova/frontend:latest ./frontend
          docker push playnova/backend:latest
          docker push playnova/frontend:latest
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/playnova
            docker-compose pull
            docker-compose up -d
            docker system prune -f
```

---

## 8. 备份策略

### 8.1 数据库备份

```bash
#!/bin/bash
# scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
S3_BUCKET="playnova-backups"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
docker exec playnova-postgres pg_dump -U postgres playnova | gzip > $BACKUP_DIR/playnova_$DATE.sql.gz

# 上传到S3
aws s3 cp $BACKUP_DIR/playnova_$DATE.sql.gz s3://$S3_BUCKET/postgres/

# 删除30天前的本地备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: playnova_$DATE.sql.gz"
```

### 8.2 定时备份

```bash
# 添加到crontab
# 每天凌晨2点备份
0 2 * * * /opt/playnova/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

---

## 9. 性能优化

### 9.1 Nginx缓存配置

```nginx
# nginx缓存配置
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m use_temp_path=off;

server {
    # API缓存
    location /api/v1/levels {
        proxy_cache api_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_use_stale error timeout updating;
        proxy_cache_background_update on;
        proxy_cache_lock on;
        
        proxy_pass http://backend:3000;
    }
}
```

### 9.2 Redis缓存策略

```typescript
// backend/src/common/decorators/cache.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';

export function Cache(key: string, ttl: number = 3600) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    SetMetadata(CACHE_KEY, key);
    SetMetadata(CACHE_TTL, ttl);
  };
}

// 使用示例
@Get('levels')
@Cache('levels:list', 1800) // 缓存30分钟
async getLevels() {
  return this.levelService.findAll();
}
```

---

## 10. 灾难恢复

### 10.1 故障转移流程

```
1. 监控系统检测到故障
   ↓
2. 自动触发告警（邮件、短信、Slack）
   ↓
3. 尝试自动重启服务
   ↓
4. 如果失败，切换到备用服务器
   ↓
5. 通知运维团队
   ↓
6. 恢复主服务器
   ↓
7. 同步数据
   ↓
8. 切换回主服务器
```

### 10.2 数据恢复

```bash
# 从S3恢复数据库
aws s3 cp s3://playnova-backups/postgres/playnova_20240101_020000.sql.gz ./backup.sql.gz
gunzip backup.sql.gz
docker exec -i playnova-postgres psql -U postgres playnova < backup.sql
