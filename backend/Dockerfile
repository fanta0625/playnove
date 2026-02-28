# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装构建工具和Python（用于编译bcrypt）
RUN apk add --no-cache python3 make g++ libc6-compat

# 复制package文件
COPY package*.json ./
COPY prisma ./prisma

# 安装依赖（包括dev依赖，用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 生成Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 安装OpenSSL依赖
RUN apk add --no-cache openssl openssl-dev

# 安装生产依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制Prisma相关文件
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 创建日志和上传目录
RUN mkdir -p logs uploads

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "dist/main"]
