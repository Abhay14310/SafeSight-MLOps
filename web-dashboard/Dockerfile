FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev
COPY . .
RUN mkdir -p /app/uploads
EXPOSE 3000
CMD ["node", "script.js"]