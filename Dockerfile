FROM node:8.11.1-alpine
WORKDIR /opt/app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 80
RUN npm run build \
  && rm -rf src \
  && ln -s dist src
CMD [ "npm", "run", "start" ]
