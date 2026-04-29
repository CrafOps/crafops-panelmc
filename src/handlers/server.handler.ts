import type { FastifyRequest, FastifyReply } from 'fastify';
import { docker } from '../utils/docker.js';
import path from 'path';
import fs from 'fs';

const SAFE_ROOT = path.resolve('./data/servers');

/**
 * ตรวจสอบและสร้าง Path ที่ปลอดภัยสำหรับเก็บข้อมูล Minecraft
 */
const getSafePath = (serverName: string) => {
  const targetPath = path.resolve(SAFE_ROOT, serverName);
  if (!targetPath.startsWith(SAFE_ROOT)) {
    throw new Error('Security Breach: Attempted to access path outside of data directory');
  }
  return targetPath;
};

interface CreateServerBody {
  serverName: string;
  port: number;
  version?: string;
  serverType: 'java' | 'bedrock';
}

/**
 * Handler สำหรับสร้างเซิร์ฟเวอร์ใหม่
 */
export const createServerHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { serverName, port, version = 'LATEST', serverType } = request.body as CreateServerBody;

    if (!serverName || !port || !serverType) {
      return reply.status(400).send({ error: 'Missing required fields: serverName, port, or serverType' });
    }

    // กำหนด Image และ Internal Port ตามประเภทเซิร์ฟเวอร์
    const baseImage = serverType === 'java' ? 'itzg/minecraft-server' : 'itzg/minecraft-bedrock-server';
    const imageName = `${baseImage}:latest`; 
    const internalPort = serverType === 'java' ? '25565/tcp' : '19132/udp';

    const serverDataPath = getSafePath(serverName);
    if (!fs.existsSync(serverDataPath)) {
      fs.mkdirSync(serverDataPath, { recursive: true });
    }

    // เช็คและดึง Image
    const images = await docker.listImages();
    const hasImage = images.some(img => img.RepoTags?.includes(imageName));

    if (!hasImage) {
      request.log.info(`Pulling ${imageName}...`);
      await new Promise((resolve, reject) => {
        docker.pull(imageName, (err: any, stream: any) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err: any, res: any) => err ? reject(err) : resolve(res));
        });
      });
    }

    // สร้าง Container พร้อม Config ตาม Server Type
    const container = await docker.createContainer({
      Image: imageName,
      name: serverName,
      Labels: {
        "com.docker.compose.project": "MC-Panel", 
        "com.docker.compose.service": serverName,
        "created-by": "@PPekKunGzDev",
        "mc-type": serverType // ระบุประเภทไว้ใช้ตอน List
      },
      Env: [
        'EULA=TRUE', 
        `VERSION=${version.toUpperCase()}`,
        'GAMEMODE=survival', 
        'DIFFICULTY=easy',
        'ENABLE_AUTOPAUSE=false' // ปิดโหมดหลับถ้าไม่มีคนเล่น เพื่อความไหลลื่น
      ],
      ExposedPorts: { [internalPort]: {} },
      HostConfig: {
        Binds: [`${serverDataPath}:/data`],
        PortBindings: { 
          [internalPort]: [{ HostPort: port.toString() }] 
        },
        Memory: serverType === 'java' ? 2048 * 1024 * 1024 : 1024 * 1024 * 1024, // Java ให้ 2GB, Bedrock 1GB
        RestartPolicy: { Name: 'unless-stopped' }
      }
    });

    await container.start();
    return { status: 'Created', containerId: container.id, serverType, version };

  } catch (error: any) {
    if (error.statusCode === 409) return reply.status(409).send({ error: 'Server name already exists' });
    return reply.status(500).send({ error: error.message });
  }
};

/**
 * Handler สำหรับสั่งการ Start/Stop/Restart
 */
export const powerActionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { action } = request.params as { action: 'start' | 'stop' | 'restart' };
    const { containerId } = request.body as { containerId: string };

    const container = docker.getContainer(containerId);
    const inspect = await container.inspect();
    const isRunning = inspect.State.Running;

    if (action === 'start' && isRunning) return { message: 'Server is already running' };
    if (action === 'stop' && !isRunning) return { message: 'Server is already stopped' };

    if (action === 'start') await container.start();
    else if (action === 'stop') await container.stop();
    else if (action === 'restart') await container.restart();

    return { status: `Success: ${action}` };
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

/**
 * Handler สำหรับลบเซิร์ฟเวอร์
 */
export const deleteServerHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { containerId, serverName, deleteData = false } = request.body as { 
      containerId: string, 
      serverName?: string, 
      deleteData?: boolean 
    };

    const container = docker.getContainer(containerId);
    await container.remove({ force: true });

    if (deleteData && serverName) {
      const targetDir = getSafePath(serverName);
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
        return { status: 'Deleted: Container and Data' };
      }
    }

    return { status: 'Deleted: Container only' };
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

/**
 * Handler สำหรับลิสต์รายการเซิร์ฟเวอร์ทั้งหมดในโปรเจกต์
 */
export const listServersHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const containers = await docker.listContainers({
      all: true,
      filters: { label: ["com.docker.compose.project=MC-Panel"] }
    });

    return containers.map(container => ({
      id: container.Id,
      name: container.Names[0]?.replace('/', '') || 'unknown',
      state: container.State,
      status: container.Status,
      image: container.Image,
      type: container.Labels["mc-type"] || 'bedrock', // ดึงประเภทจาก Label
      ports: (container.Ports || []).map(p => ({
        public: p.PublicPort,
        private: p.PrivatePort,
        type: p.Type
      }))
    }));
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};