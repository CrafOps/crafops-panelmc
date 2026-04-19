import path from 'path';

const SAFE_ROOT = path.resolve('./data/servers');

export const getSafePath = (serverName: string) => {
  const targetPath = path.resolve(SAFE_ROOT, serverName);
  
  // ตรวจสอบว่า targetPath ต้องขึ้นต้นด้วย SAFE_ROOT เท่านั้น (ป้องกัน ../../)
  if (!targetPath.startsWith(SAFE_ROOT)) {
    throw new Error('Security Breach: Attempted to access path outside of data directory');
  }
  
  return targetPath;
};