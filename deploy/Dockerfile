# 锦绣古镇：汉服织造录 - 生产部署镜像
FROM node:18-alpine AS builder

WORKDIR /app
COPY server/package.json ./
RUN npm install

COPY server/src ./src
COPY config/json ./config

EXPOSE 3000
CMD ["node", "src/app.js"]
