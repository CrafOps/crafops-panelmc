import { docker } from '../utils/docker.js';
import { io } from '../utils/socket.js';
import type { Readable } from 'stream';
import type { Socket } from 'socket.io';

const activeStreams = new Map<string, Readable>();

export const streamLogs = async (containerId: string, socket: Socket) => {
  const container = docker.getContainer(containerId);

  try {
    // [1] ส่ง Log ย้อนหลังให้คนที่เพิ่งเข้ามาทันที (Buffer)
    // ไม่ว่าท่อจะ Active อยู่หรือไม่ คนมาใหม่ต้องเห็น Log เก่าก่อน
    const existingLogs = await container.logs({
      stdout: true,
      stderr: true,
      tail: 50,    // ดึง 50 บรรทัดล่าสุด
      follow: false // ดึงครั้งเดียวจบ
    });
    
    socket.emit('log-data', existingLogs.toString('utf-8'));

    // [2] ถ้ามี Stream ค้างไว้สำหรับ Container นี้อยู่แล้ว ไม่ต้องสร้างท่อใหม่
    if (activeStreams.has(containerId)) {
      console.log(`ℹ️ Client ${socket.id} attached to existing stream: ${containerId}`);
      return;
    }

    // [3] ถ้ายังไม่มีท่อ ให้สร้างท่อใหม่ (Follow)
    const logStream = (await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: 0 // ไม่ต้องเอา tail แล้วเพราะเราส่ง manual ไปข้างบนแล้ว
    })) as Readable;

    activeStreams.set(containerId, logStream);
    console.log(`📡 Started NEW stream for: ${containerId}`);

    logStream.on('data', (chunk) => {
      const message = chunk.toString('utf-8');
      
      // ส่งหาทุกคนที่อยู่ใน Room (รวมถึงคนใหม่ด้วย)
      io.to(containerId).emit('log-data', message);

      // --- Safety Check ---
      const room = io.sockets.adapter.rooms.get(containerId);
      if (!room || room.size === 0) {
        console.log(`🔌 No clients watching ${containerId}. Closing stream...`);
        logStream.destroy();
        activeStreams.delete(containerId);
      }
    });

    logStream.on('end', () => activeStreams.delete(containerId));
    logStream.on('error', () => activeStreams.delete(containerId));

  } catch (error) {
    console.error(`❌ Stream Error:`, error);
  }
};