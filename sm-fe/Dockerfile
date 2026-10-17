FROM node:22-alpine AS build

WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm ci

# Copy source code và build
COPY . .
RUN npm run build

# Giai đoạn 2: Chạy bằng Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]