import { docker } from '../utils/docker.js';
import path from 'path';
import tar from 'tar-stream';
import fs from 'fs/promises';
import { Buffer } from 'node:buffer';

const streamToBuffer = async (stream: any): Promise<Buffer> => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
};

const DATA_ROOT = path.resolve('./data/servers');

export const getFileList = async (containerId: string, folderPath: string = '/data') => {
    const container = docker.getContainer(containerId);
    const inspect = await container.inspect();
    const serverName = inspect.Name.replace('/', '');

    if (inspect.State.Running) {
        const exec = await container.exec({
            Cmd: ['ls', '-F', '--color=never', folderPath],
            AttachStdout: true,
        });
        const stream = await exec.start({});
        
        return new Promise((resolve) => {
            let output = '';
            stream.on('data', (chunk) => output += chunk.toString());
            stream.on('end', () => {
                const files = output.split('\n')
                    .map(f => f.trim())
                    .filter(f => f && !f.startsWith('total')) 
                    .map(f => {
                        const cleanName = f.replace(/\u001b\[[0-9;]*[mGJKHF]/g, '')
                                           .replace(/[^\x20-\x7E]/g, '');
                        return {
                            name: cleanName.replace(/[\/\*@]$/, ''),
                            isDirectory: f.endsWith('/'),
                            path: path.posix.join(folderPath, cleanName.replace(/[\/\*@]$/, ''))
                        };
                    });
                resolve(files);
            });
        });
    } 
    
    else {
        try {
            const relativePath = folderPath.replace(/^\/data/, '');
            const hostPath = path.join(DATA_ROOT, serverName, relativePath);

            const entries = await fs.readdir(hostPath, { withFileTypes: true });
            
            const files = entries.map(entry => ({
                name: entry.name,
                isDirectory: entry.isDirectory(),
                path: path.posix.join(folderPath, entry.name)
            }));

            return files;
        } catch (err) {
            return [];
        }
    }
};

export const readFileContent = async (containerId: string, filePath: string) => {
    const container = docker.getContainer(containerId);
    const archiveStream = await container.getArchive({ path: filePath });
    return new Promise((resolve) => {
        const extract = tar.extract();
        let content = '';
        extract.on('entry', (header, stream, next) => {
            stream.on('data', (chunk) => content += chunk.toString());
            stream.on('end', next);
        });
        extract.on('finish', () => resolve(content));
        archiveStream.pipe(extract);
    });
};

export const saveFileContent = async (containerId: string, filePath: string, content: string) => {
    const container = docker.getContainer(containerId);
    const pack = tar.pack();
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    pack.entry({ name: fileName }, content);
    pack.finalize();
    return await container.putArchive(pack, { path: dirName });
};

export const deleteFile = async (containerId: string, filePath: string) => {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
        Cmd: ['rm', '-rf', filePath],
    });
    return await exec.start({});
};

export const createNewFile = async (containerId: string, folderPath: string, fileName: string) => {
    return await saveFileContent(containerId, path.posix.join(folderPath, fileName), '');
};

export const createNewFolder = async (containerId: string, folderPath: string, folderName: string) => {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
        Cmd: ['mkdir', '-p', path.posix.join(folderPath, folderName)],
    });
    return await exec.start({});
};

export const handleArchive = async (containerId: string, action: 'zip' | 'unzip', targetPath: string) => {
    const container = docker.getContainer(containerId);
    const cmd = action === 'zip' 
        ? ['zip', '-r', `${targetPath}.zip`, targetPath]
        : ['unzip', targetPath, '-d', path.dirname(targetPath)];
    
    const exec = await container.exec({ Cmd: cmd });
    return await exec.start({});
};

export const uploadFileToContainer = async (containerId: string, folderPath: string, fileStream: any, fileName: string) => {
    const container = docker.getContainer(containerId);
    const pack = tar.pack();
    
    // แปลง stream เป็น buffer ด้วย helper ที่เราสร้าง
    const buffer = await streamToBuffer(fileStream);
    
    pack.entry({ name: fileName }, buffer);
    pack.finalize();

    return await container.putArchive(pack, { path: folderPath });
};