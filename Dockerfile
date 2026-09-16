FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
EXPOSE 3000
CMD ["node", "index.js"]
