# ========================================================
# Giai đoạn 1: Build source code React bằng Node.js
# ========================================================
FROM node:22-alpine AS build

WORKDIR /app

# Cài đặt dependencies (tận dụng Docker cache)
COPY package*.json ./
RUN npm ci

# Copy toàn bộ source code
COPY . .

# Hỗ trợ truyền biến môi trường API vào lúc build (cho VPS hoặc domain)
ARG VITE_API_URL
ARG VITE_CHAT_HUB_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CHAT_HUB_URL=$VITE_CHAT_HUB_URL

RUN npm run build

# ========================================================
# Giai đoạn 2: Phục vụ file tĩnh siêu nhẹ bằng Nginx
# ========================================================
FROM nginx:alpine

# Copy file cấu hình Nginx hỗ trợ React SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy bản build vào thư mục phục vụ của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
