FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV DB_SYNC=false
CMD ["npm", "run", "start:prod"]
