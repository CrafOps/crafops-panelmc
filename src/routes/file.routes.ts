import { 
    getFileList, 
    readFileContent, 
    saveFileContent, 
    deleteFile, 
    createNewFile,
    createNewFolder,
    handleArchive,
    uploadFileToContainer
} from '../handlers/file.handler.js';

export const fileRoutes = async (fastify: any) => {
    fastify.get('/:id/files', async (req: any) => {
        return await getFileList(req.params.id, req.query.path);
    });

    fastify.get('/:id/files/content', async (req: any) => {
        return { content: await readFileContent(req.params.id, req.query.path) };
    });

    fastify.post('/:id/files/save', async (req: any) => {
        const { path: filePath, content } = req.body;
        await saveFileContent(req.params.id, filePath, content);
        return { success: true, message: 'Saved successfully' };
    });

    fastify.delete('/:id/files/delete', async (req: any) => {
        const { path: filePath } = req.body;
        await deleteFile(req.params.id, filePath);
        return { success: true, message: 'Deleted successfully' };
    });

    fastify.post('/:id/files/create', async (req: any) => {
        const { path: folderPath, name } = req.body;
        await createNewFile(req.params.id, folderPath, name);
        return { success: true, message: 'File created' };
    });

    fastify.post('/:id/files/create-folder', async (req: any) => {
        const { path: folderPath, name } = req.body;
        await createNewFolder(req.params.id, folderPath, name);
        return { success: true, message: 'Folder created' };
    });

    fastify.post('/:id/files/archive', async (req: any) => {
        const { action, path: targetPath } = req.body;
        await handleArchive(req.params.id, action, targetPath);
        return { success: true, message: `${action} completed` };
    });
    
    fastify.post('/:id/files/upload', async (req: any, reply: any) => {
        const data = await req.file();
        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }
    
        const { path: folderPath } = req.query;
        const containerId = req.params.id;
    
        try {
            await uploadFileToContainer(containerId, folderPath, data.file, data.filename);
            return { success: true };
        } catch (err: any) {
            return reply.status(500).send({ error: err.message });
        }
    });
};