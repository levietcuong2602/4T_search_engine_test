FROM node:12.19.0

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -g pm2 && npm install -g nodemon

COPY . .

EXPOSE 3000

CMD ["npm", "run",  "dev"]
