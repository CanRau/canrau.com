# note: [8 Protips to Start Killing It When Dockerizing Node.js](https://nodesource.com/blog/8-protips-to-start-killing-it-when-dockerizing-node-js/)
# TODO: if I can fix memory usage by yarn switch back to `flyctl scale memory 256` ? [ref](https://community.fly.io/t/using-yarn-2-causes-enomem/999)
# check for namespacing https://github.com/puppeteer/puppeteer/issues/290#issuecomment-322885826
# check for namespacing https://stackoverflow.com/questions/39215025/how-to-check-if-linux-user-namespaces-are-supported-by-current-os-kernel
# # RUN sysctl -w kernel.unprivileged_userns_clone=1
# from https://superuser.com/questions/1094597/enable-user-namespaces-in-debian-kernel#comment2256770_1122977
# # RUN sysctl -w kernel.userns_restrict=0
# # from https://unix.stackexchange.com/a/303214/441072
# # RUN echo 0 > /proc/sys/kernel/userns_restrict
# from https://unix.stackexchange.com/questions/303213/how-to-enable-user-namespaces-in-the-kernel-for-unprivileged-unshare#comment814829_303214
# # RUN echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/userns.conf
# https://unix.stackexchange.com/a/602409/441072
# RUN echo "kernel.unprivileged_userns_clone=1" >> /etc/sysctl.conf
# RUN /app/namespacing.sh

# BASE
FROM node:16-bullseye-slim as base

ARG COMMIT_SHA

# update linux deps
RUN apt-get update \
        && apt-get install -y -q openssl \
        # install deps needed for [skia-canvas](https://github.com/samizdatco/skia-canvas#running-in-docker)
        && apt-get install -y -q --no-install-recommends libfontconfig1 fontconfig

# RUN wget https://github.com/samuelngs/apple-emoji-linux/releases/download/ios-15.4/AppleColorEmoji.ttf
# RUN echo "__FONTS BEFORE" && ls -lAFh ~/.local/share/fonts
# RUN mv AppleColorEmoji.ttf ~/.local/share/fonts
# RUN echo "__FONTS AFTER" && ls -lAFh ~/.local/share/fonts

# https://github.com/eosrei/twemoji-color-font
# https://linoxide.com/install-emojione-color-svginot-font-ubuntu/
# RUN fc-cache -vfrs
# RUN apt-get install -y -q \
#         # https://github.com/eosrei/twemoji-color-font
# ttf-bitstream-vera \
# fonts-liberation2 fonts-noto-color-emoji \
#         # https://itsfoss.com/add-apt-repository-command-not-found/
#         software-properties-common
# RUN fc-cache -vfrs
# && apt-add-repository ppa:eosrei/fonts \
# && apt-get update \
# && apt-get install -y fonts-twemoji-svginot
# RUN apt-get install fonts-noto-core fonts-noto-mono fonts-noto-extra fonts-noto-ui-core fonts-noto-color-emoji

# 1. Download the latest version
# RUN wget https://github.com/eosrei/twemoji-color-font/releases/download/v13.1.0/TwitterColorEmoji-SVGinOT-Linux-13.1.0.tar.gz
# # 2. Uncompress the file
# RUN tar zxf TwitterColorEmoji-SVGinOT-Linux-13.1.0.tar.gz
# # 3. Run the installer
# RUN cd TwitterColorEmoji-SVGinOT-Linux-13.1.0
# RUN ./install.sh

# DEPS - Install all node_modules, including dev dependencies
FROM base as deps

ARG COMMIT_SHA

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

ADD package.json yarn.lock .yarnrc.yml ./
# note: ADD copies the contents of a folder instead of the folder 🤷‍♂️ [SO](https://stackoverflow.com/a/54616645/3484824)
COPY .yarn .yarn
# keeping because I using Puppeteer only locally at the moment
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# RUN du -sh * | sort -h
RUN yarn install
# RUN du -sh * | sort -h

# PRODUCTION-DEPS - Setup production node_modules
FROM base as production-deps

ARG COMMIT_SHA

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY --from=deps /home/node/app/node_modules /home/node/app/node_modules
COPY --from=deps /home/node/app/.yarn /home/node/app/.yarn
ADD package.json yarn.lock .yarnrc.yml /home/node/app/
# RUN du -sh * | sort -h
RUN yarn workspaces focus --all --production
# RUN du -sh * | sort -h

# BUILD the app
FROM base as build

ARG COMMIT_SHA

# todo: KCD sets it only in last step?
ENV NODE_ENV=production

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node

# note: COPY --chown [found at DO](https://www.digitalocean.com/community/tutorials/how-to-build-a-node-js-application-with-docker)
COPY --from=deps --chown=node:node /home/node/app/node_modules /home/node/app/node_modules
# COPY --from=deps ./package.json ./package.json
# COPY --from=deps ./.yarn ./.yarn
# COPY --from=deps ./yarn.lock ./yarn.lock
# COPY --from=deps ./.yarnrc.yml ./.yarnrc.yml

# RUN du -sh * | sort -h
ADD --chown=node:node . .
# RUN du -sh * | sort -h
RUN yarn build

# Finally, build the production image with minimal footprint
FROM base
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

# from https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init
ENTRYPOINT ["dumb-init", "--"]
RUN echo "kernel.unprivileged_userns_clone=1" >> /etc/sysctl.conf
# todo: get `USER node` working

ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA
# ENV CSRF_KEY=$CSRF_KEY

ENV NODE_ENV=production
ENV OS_ENV=container

COPY --chown=node:node --from=production-deps /home/node/app/node_modules /home/node/app/node_modules
COPY --chown=node:node --from=build /home/node/app/build /home/node/app/build
COPY --chown=node:node --from=build /home/node/app/public /home/node/app/public
# RUN ls -lAFh
# RUN du -sh * | sort -h
ADD --chown=node:node . .
# RUN ls -lAFh
# RUN du -sh * | sort -h

USER node

CMD ["./node_modules/.bin/remix-serve", "build"]