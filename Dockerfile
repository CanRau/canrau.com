# TODO: if I can fix memory usage by yarn switch back to `flyctl scale memory 256` ? [ref](https://community.fly.io/t/using-yarn-2-causes-enomem/999)
# BASE
FROM node:16-bullseye-slim as base

ARG COMMIT_SHA

# update linux deps & install deps needed for puppeteer, [code from](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker)
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# DEPS - Install all node_modules, including dev dependencies
FROM base as deps

ARG COMMIT_SHA

RUN mkdir /app
WORKDIR /app

ADD package.json yarn.lock .yarnrc.yml ./
# note: ADD copies the contents of a folder instead of the folder 🤷‍♂️ [SO](https://stackoverflow.com/a/54616645/3484824)
COPY .yarn .yarn
# RUN du -sh * | sort -h
RUN yarn install
# RUN du -sh * | sort -h

# PRODUCTION-DEPS - Setup production node_modules
FROM base as production-deps

ARG COMMIT_SHA

RUN mkdir /app
WORKDIR /app

# maybe disable next line?
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/.yarn /app/.yarn
ADD package.json yarn.lock .yarnrc.yml /app/
# RUN du -sh * | sort -h
RUN yarn workspaces focus --all --production
# RUN du -sh * | sort -h

# BUILD the app
FROM base as build

ARG COMMIT_SHA

# todo: KCD sets it only in last step?
ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
# COPY --from=deps /app/package.json /app/package.json
# COPY --from=deps /app/.yarn /app/.yarn
# COPY --from=deps /app/yarn.lock /app/yarn.lock
# COPY --from=deps /app/.yarnrc.yml /app/.yarnrc.yml

# RUN du -sh * | sort -h
ADD . .
# RUN du -sh * | sort -h
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
# RUN du -sh * | sort -h
ADD . .
# RUN ls -lAFh
# RUN du -sh * | sort -h

# CMD ["yarn", "start"]
CMD ["npm", "run", "start"]
# CMD ["remix-serve", "build"] // Cannot find module '/app/remix-serve'
