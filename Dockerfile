FROM node:12.22.10

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . ./

RUN npm install -g yarn && yarn

RUN cd /usr/src/app

RUN yarn build && yarn knex:migrate:latest && yarn knex seed:run

CMD [ "yarn", "production" ]

