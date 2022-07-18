FROM node:14-alpine

# set production mode to get optimized performance
ENV NODE_ENV production

# automatically set project_id with current project
ENV PROJECT_ID $PROJECT_ID

WORKDIR /usr/src/app

COPY package*.json ./

# RUN apk update && apk upgrade && apk add --no-cache bash git openssh
# RUN npm ci --only=production
RUN npm ci --only=production

COPY . ./

CMD ["npm", "start"]
