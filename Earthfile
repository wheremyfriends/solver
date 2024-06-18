VERSION 0.8

build:
    FROM node:22-alpine
    WORKDIR /app
    RUN npm install -g pnpm \
        && npm cache clean --force
    COPY package.json pnpm-lock.yaml .
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    SAVE ARTIFACT dist AS LOCAL dist
