FROM node:22-slim

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY bin ./bin
COPY src ./src

ENV PORT=8000
ENV ROOTS_CONFIG=/app/roots.yml
EXPOSE 8000

CMD ["node", "bin/readloom.js"]
