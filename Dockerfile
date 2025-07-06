FROM node:21-alpine3.20 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build


FROM nginx:latest
COPY --from=builder /app/dist /usr/share/nginx/html
expose 80