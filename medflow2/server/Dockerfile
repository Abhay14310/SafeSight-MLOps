FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p /app/uploads
EXPOSE 5060
CMD ["node","server.js"]
