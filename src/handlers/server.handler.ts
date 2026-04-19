import type { FastifyRequest, FastifyReply } from 'fastify';
import { docker } from '../utils/docker.js';
import path from 'path';
import fs from 'fs';

// --- Helper: ระบบความปลอดภัยของ Path ---
const SAFE_ROOT = path.resolve('./data/servers');

const getSafePath = (serverName: string) => {
  const targetPath = path.resolve(SAFE_ROOT, serverName);
  // ตรวจสอบว่า Path ที่ได้ต้องอยู่ภายใต้ SAFE_ROOT เท่านั้น (ป้องกัน ../../../)
  if (!targetPath.startsWith(SAFE_ROOT)) {
    throw new Error('Security Breach: Attempted to access path outside of data directory');
  }
  return targetPath;
};

interface CreateServerBody {
  serverName: string;
  port: number;
}

// 1. สร้างเซิร์ฟเวอร์
export const createServerHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { serverName, port } = request.body as CreateServerBody;
    const imageName = 'itzg/minecraft-bedrock-server:latest';

    if (!serverName || !port) {
      return reply.status(400).send({ error: 'Missing serverName or port' });
    }

    const serverDataPath = getSafePath(serverName);
    
    if (!fs.existsSync(serverDataPath)) {
      fs.mkdirSync(serverDataPath, { recursive: true });
    }

    // Pull Image Logic
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

    const container = await docker.createContainer({
      Image: imageName,
      name: serverName,
      Labels: {
        "com.docker.compose.project": "MC-Panel", 
        "com.docker.compose.service": serverName,
        "created-by": "@PPekKunGzDev"
      },
      Env: ['EULA=TRUE', 'GAMEMODE=survival', 'DIFFICULTY=easy'],
      ExposedPorts: { '19132/udp': {} },
      HostConfig: {
        Binds: [`${serverDataPath}:/data`],
        PortBindings: { '19132/udp': [{ HostPort: port.toString() }] },
        Memory: 1024 * 1024 * 1024,
        RestartPolicy: { Name: 'unless-stopped' }
      }
    });

    await container.start();
    return { status: 'Created', containerId: container.id, storagePath: serverDataPath };

  } catch (error: any) {
    if (error.statusCode === 409) return reply.status(409).send({ error: 'Server name exists' });
    return reply.status(500).send({ error: error.message });
  }
};

// 2. ควบคุมสถานะ (Start/Stop/Restart) พร้อมเช็คสถานะปัจจุบัน
export const powerActionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { action } = request.params as { action: 'start' | 'stop' | 'restart' };
    const { containerId } = request.body as { containerId: string };

    const container = docker.getContainer(containerId);
    const inspect = await container.inspect();
    const isRunning = inspect.State.Running;

    // ดักเคสซ้ำซ้อน
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

// 3. ลบเซิร์ฟเวอร์ (2 Modes: Instance Only / Everything)
export const deleteServerHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { containerId, serverName, deleteData = false } = request.body as { 
      containerId: string, 
      serverName?: string, 
      deleteData?: boolean 
    };

    const container = docker.getContainer(containerId);

    // ลบคอนเทนเนอร์ทันที (Force)
    await container.remove({ force: true });

    // ถ้าสั่งลบข้อมูลถาวร
    if (deleteData && serverName) {
      const targetDir = getSafePath(serverName);
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
        return { status: 'Deleted everything (Container + Files)' };
      }
    }

    return { status: 'Container deleted, data preserved' };
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

//List Server on Container
export const listServersHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // กรองเฉพาะ Container ที่มี Label ของโปรเจกต์เรา
    const containers = await docker.listContainers({
      all: true, // เอามาทั้งที่รันอยู่และที่หยุดไปแล้ว
      filters: {
        label: ["com.docker.compose.project=MC-Panel"]
      }
    });

    const serverList = containers.map(container => {
      return {
        id: container.Id,
        name: (container.Names && container.Names[0]) 
                ? container.Names[0].replace('/', '') 
                : 'unknown-server',
    
        state: container.State,
        status: container.Status,
        image: container.Image,
    
        ports: (container.Ports || []).map(p => ({
          public: p.PublicPort,
          private: p.PrivatePort,
          type: p.Type
        }))
      };
    });

    return serverList;
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};