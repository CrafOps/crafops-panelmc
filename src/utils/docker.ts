import Docker from 'dockerode';
// singleton instance
export const docker = new Docker({ host: '127.0.0.1', port: 2375 });

// export const docker = new Docker({
//     // สำหรับ Linux/Mac (ตอนขึ้น Prod):
//     // socketPath: '/var/run/docker.sock'
//   });