FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
ENV DB_SYNC=false
CMD ["npm", "run", "start:prod"]
