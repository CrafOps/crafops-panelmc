import { getJavaVersions } from "../utils/minecraft.utils.js";

export const metaRoutes = async (fastify: any) => {
    fastify.get('/meta/java-versions', async () => {
        return await getJavaVersions();
    });
}