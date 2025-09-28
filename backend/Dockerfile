FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json backend/
RUN npm ci --prefix backend

COPY backend/ backend/
COPY shared/ shared/
COPY contracts/ contracts/

WORKDIR /app/backend
RUN npm run build

ENV DB_SYNC=false
CMD ["npm", "run", "start:prod"]
