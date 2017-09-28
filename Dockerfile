FROM node:latest

EXPOSE 4567

ENV REDIS_HOST "redis"
ENV REDIS_PORT 6379
ENV REDIS_PASSWORD ""
ENV REDIS_DB ""

COPY package.json package.json
COPY index.js index.js

RUN npm install

ENTRYPOINT ["npm", "run", "start"]
