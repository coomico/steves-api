FROM node:22.14-alpine AS build

WORKDIR /usr/src/api

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:22.14-alpine AS prod

WORKDIR /usr/src/api

COPY --from=build --chown=node:node /usr/src/api/dist dist/
COPY --from=build --chown=node:node /usr/src/api/node_modules node_modules/

RUN npm cache clean --force

USER node

CMD [ "node", "dist/main" ]