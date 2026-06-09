FROM node:22-alpine

WORKDIR /app

# Cài đúng major version tương thích với lockfile
RUN npm install -g pnpm@10.15.1

COPY package.json pnpm-lock.yaml ./

# Cài dependencies
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]