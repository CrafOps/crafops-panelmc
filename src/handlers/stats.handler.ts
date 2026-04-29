import { docker } from '../utils/docker.js';
import { io } from '../utils/socket.js';

const activeStatsStreams = new Map<string, any>();

export const streamStats = async (containerId: string) => {
  if (activeStatsStreams.has(containerId)) return;

  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();

    const networks = info.NetworkSettings.Networks;
    const networkNames = Object.keys(networks);
    const firstNetwork = networkNames[0];
    const internalIp = networks[firstNetwork as any]?.IPAddress || '127.0.0.1';

    const ports = info.NetworkSettings.Ports;
    let publicPort = '';
    for (const key in ports) {
      if (ports[key] && ports[key]![0]) {
        publicPort = ports[key]![0].HostPort;
        break;
      }
    }

    if (!publicPort) {
      publicPort = info.Config.Labels?.['mc-type'] === 'java' ? '25565' : '19132';
    }

    const statsStream = (await container.stats({ stream: true })) as any;
    activeStatsStreams.set(containerId, statsStream);

    statsStream.on('data', (chunk: Buffer) => {
      let data;
      try { data = JSON.parse(chunk.toString()); } catch (e) { return; }

      const cpuDelta = data.cpu_stats.cpu_usage.total_usage - data.precpu_stats.cpu_usage.total_usage;
      const systemDelta = data.cpu_stats.system_cpu_usage - data.precpu_stats.system_cpu_usage;
      const cpuPercent = (systemDelta > 0) ? (cpuDelta / systemDelta) * data.cpu_stats.online_cpus * 100 : 0;

      const memUsage = data.memory_stats.usage / 1024 / 1024;
      const memLimit = data.memory_stats.limit / 1024 / 1024;

      io.to(containerId).emit('stats-data', {
        cpu: isNaN(cpuPercent) ? "0.00" : cpuPercent.toFixed(2),
        ramUsage: isNaN(memUsage) ? "0.00" : memUsage.toFixed(2),
        ramLimit: isNaN(memLimit) ? "0.00" : memLimit.toFixed(2),
        ip: `${internalIp}:${publicPort}`,
        netIO: data.networks ? Object.values(data.networks)[0] : { rx_bytes: 0, tx_bytes: 0 }
      });

      const room = io.sockets.adapter.rooms.get(containerId);
      if (!room || room.size === 0) {
        statsStream.destroy();
        activeStatsStreams.delete(containerId);
      }
    });

    statsStream.on('error', () => activeStatsStreams.delete(containerId));
  } catch (error) {
    activeStatsStreams.delete(containerId);
  }
};