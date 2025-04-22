FROM node:22-alpine

WORKDIR /app

COPY yarn.lock package.json ./

RUN yarn install --frozen-lockfile

COPY . .

RUN npx prisma generate

RUN yarn build

EXPOSE 3001

CMD ["yarn", "prod"]