import type { FastifyInstance } from 'fastify';
import { createServerHandler, deleteServerHandler, listServersHandler, powerActionHandler } from '../handlers/server.handler.js';

export async function serverRoutes(fastify: FastifyInstance) {
  fastify.get('/', listServersHandler);
  fastify.post('/create', createServerHandler);
  fastify.post('/power/:action', powerActionHandler); // เรียกใช้เป็น /servers/power/start
  fastify.delete('/delete', deleteServerHandler);
}