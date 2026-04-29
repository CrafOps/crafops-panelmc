import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { serverRoutes } from './routes/server.routes.js';
import { initSocket } from './utils/socket.js';
import { fileRoutes } from './routes/file.routes.js';
import { metaRoutes } from './routes/meta.routes.js';

const fastify = Fastify({ logger: false });

fastify.register(multipart)
fastify.register(metaRoutes);
fastify.register(serverRoutes, { prefix: '/servers' });
fastify.register(fileRoutes, { prefix: '/servers' });

await fastify.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
});

const start = async () => {
  try {
    await fastify.listen({ port: 8080 });
    console.log('🚀 Backend running at http://localhost:8080');
    initSocket(fastify);
    console.log('🚀 Real-time System Ready');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();