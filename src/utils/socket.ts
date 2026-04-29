import { Server } from 'socket.io';
import type { FastifyInstance } from 'fastify';
import { streamLogs } from '../handlers/terminal.handler.js';
import { docker } from './docker.js';
import { streamStats } from '../handlers/stats.handler.js';

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
      console.log("🔍 Requested ID:", containerId);
      socket.join(containerId);
      await streamLogs(containerId, socket);
      await streamStats(containerId);
    });

    // ดักฟังคำสั่งจากหน้าเว็บ
    socket.on('server-command', async ({ containerId, command }) => {
      try {
        const container = docker.getContainer(containerId);
    
        // ท่าไม้ตายสำหรับ itzg image: สั่งรัน script 'send-command' ข้างใน container
        // วิธีนี้มันจะไปหา process เกมแล้วยัดคำสั่งให้เราเองอัตโนมัติ
        const exec = await container.exec({
          AttachStdin: false,
          AttachStdout: true,
          AttachStderr: true,
          Tty: false,
          Cmd: ['send-command', command] 
        });
    
        const stream = await exec.start({});
        
        // ดึง output มาดูเผื่อมี error
        stream.on('data', (chunk) => {
          console.log(`💬 Container Response: ${chunk.toString()}`);
        });
    
        console.log(`💻 Command sent via send-command script: ${command}`);
      } catch (err) {
        console.error("❌ Command failed:", err);
        
        // Fallback: ถ้าไม่มี script นั้น ให้ใช้ท่ามาตรฐานสุดๆ ของ Docker
        try {
            const container = docker.getContainer(containerId);
            const exec = await container.exec({
                AttachStdin: true,
                Tty: true,
                Cmd: ['sh', '-c', `echo "${command}" > /proc/1/fd/0`]
            });
            const execStream = await exec.start({ hijack: true, stdin: true });
            execStream.end();
        } catch (fallbackErr) {
            console.error("❌ All methods failed");
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};