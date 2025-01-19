FROM node:18

WORKDIR /src

COPY package*.json ./

RUN npm install

COPY . .

COPY .env .env

RUN npm run build

EXPOSE 8080

CMD ["npm", "run" , "start:prod"]
