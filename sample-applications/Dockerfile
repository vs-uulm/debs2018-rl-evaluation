FROM node:9.5.0
WORKDIR /opt/retroLambda
ENV JOBS=8
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "node", "/opt/retroLambda/bin/www" ]
