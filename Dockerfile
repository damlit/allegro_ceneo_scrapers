FROM node:14.15.1-alpine3.12

WORKDIR /app

COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json

RUN npm install

COPY ./index.js /app/index.js
COPY ./mongo.js /app/mongo.js
COPY ./allegro_scraper.js /app/allegro_scraper.js
COPY ./ceneo-scraper.js /app/ceneo-scraper.js
COPY ./allegro_crawler.js /app/allegro_crawler.js
COPY ./queue_service.js /app/queue_service.js

EXPOSE 8080

CMD [ "node", "allegro_crawler.js" ]