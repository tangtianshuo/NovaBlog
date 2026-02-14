FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_BASE_PATH=/
ARG VITE_API_BASE=/api
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]
