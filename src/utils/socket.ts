import { Server } from 'socket.io';
import type { FastifyInstance } from 'fastify';
import { streamLogs } from '../handlers/terminal.handler.js';
import { docker } from './docker.js';

export let io: Server;

export const initSocket = (fastify: FastifyInstance) => {
  io = new Server(fastify.server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // ดักฟังการขอดู Log
    socket.on('watch-logs', async (containerId: string) => {
      socket.join(containerId); 
      await streamLogs(containerId, socket);
    });

    // ดักฟังคำสั่งจากหน้าเว็บ
    socket.on('server-command', async ({ containerId, command }) => {
      try {
        const container = docker.getContainer(containerId);
        
        // ส่งคำสั่งเข้า stdin ของ container
        const exec = await container.exec({
          AttachStdin: true,
          Tty: true,
          Cmd: ['sh', '-c', `echo "${command}" > /tmp/minecraft-console`] 
        });
  
        await exec.start({ hijack: true, stdin: true });
        console.log(`💻 Cmd Executed: ${command}`);
      } catch (err) {
        console.error('Command Error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};