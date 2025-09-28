FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/. .
COPY shared ./shared
COPY contracts ./contracts

RUN npm run build
ENV DB_SYNC=false
CMD ["npm", "run", "start:prod"]
