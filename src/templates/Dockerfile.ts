FROM node:18-bookworm
WORKDIR /opt/app
COPY package.json ./
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
RUN npm install --no-audit --no-fund
COPY tsconfig.json *.ts ./
RUN npm run build
USER node
CMD [ "npm", "start" ]
