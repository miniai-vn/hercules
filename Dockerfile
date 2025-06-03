FROM node:23

RUN npm install -g npm

WORKDIR /src

COPY package*.json ./

RUN yarn

COPY . .

COPY .env .env

RUN npm run build

EXPOSE 8080

CMD ["npm", "run" , "start:prod"]
