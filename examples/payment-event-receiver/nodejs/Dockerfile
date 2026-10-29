FROM node:20-slim AS build
WORKDIR /app
COPY package.json .
RUN npm install
COPY receiver.js receiver.test.js ./
RUN node --test receiver.test.js

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY receiver.js .
EXPOSE 8090
CMD ["node", "receiver.js"]
