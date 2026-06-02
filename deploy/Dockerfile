FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci
COPY server ./server
COPY server/prisma ./server/prisma
RUN cd server && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package.json ./
COPY server/prisma ./prisma
RUN mkdir -p server/public/uploads
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
