# base node image
FROM node:16-bullseye-slim as base

ARG COMMIT_SHA

# Install openssl for Prisma
RUN apt-get update && apt-get install -y

# Install all node_modules, including dev dependencies
FROM base as deps

ARG COMMIT_SHA

RUN mkdir /app
WORKDIR /app

ADD package.json yarn.lock .yarnrc.yml ./
# note: ADD copies the contents of a folder instead of the folder 🤷‍♂️ [SO](https://stackoverflow.com/a/54616645/3484824)
COPY .yarn .yarn
RUN yarn install

# Setup production node_modules
FROM base as production-deps

ARG COMMIT_SHA

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/.yarn /app/.yarn
ADD package.json yarn.lock .yarnrc.yml /app/
RUN yarn workspaces focus --all --production

# Build the app
FROM base as build

ARG COMMIT_SHA

# todo: KCD sets it only in last step?
ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
# COPY --from=deps /app/package.json /app/package.json
COPY --from=deps /app/.yarn /app/.yarn
# COPY --from=deps /app/yarn.lock /app/yarn.lock
COPY --from=deps /app/.yarnrc.yml /app/.yarnrc.yml

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
COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
# RUN ls -lAFh
ADD . .
# RUN ls -lAFh

CMD ["yarn", "start"]
