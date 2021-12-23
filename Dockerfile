# base node image
FROM node:16-bullseye-slim as base

ARG COMMIT_SHA

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl

# Install all node_modules, including dev dependencies
FROM base as deps

ARG COMMIT_SHA

RUN mkdir /app
WORKDIR /app

ADD package.json yarn.lock .yarn ./
# RUN npm install --production=false
RUN yarn install

# Setup production node_modules
# FROM base as production-deps

# ARG COMMIT_SHA

# RUN mkdir /app
# WORKDIR /app

# COPY --from=deps /app/node_modules /app/node_modules
# ADD package.json yarn.lock ./
# RUN npm prune --production

# Build the app
FROM base as build

ARG COMMIT_SHA

# todo: KCD sets it only in last step?
ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/.yarn /app/.yarn

# If we're using Prisma, uncomment to cache the prisma schema
# ADD prisma .
# RUN npx prisma generate

ADD . .
RUN yarn build

# Finally, build the production image with minimal footprint
FROM base

ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA
# ENV CSRF_KEY=$CSRF_KEY

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules

# Uncomment if using Prisma
# COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma

COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
ADD . .

CMD ["yarn", "start"]
