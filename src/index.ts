import Fastify from 'fastify';
import cors from '@fastify/cors';
import { serverRoutes } from './routes/server.routes.js';
import { initSocket } from './utils/socket.js';

const fastify = Fastify({ logger: false });

fastify.register(serverRoutes, { prefix: '/servers' });

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