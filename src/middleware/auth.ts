export const authMiddleware = async (request: any, reply: any) => {
    // สมมติเช็ค API Key ง่ายๆ ก่อน
    const apiKey = request.headers['x-api-key'];
    if (apiKey !== process.env.JWT_S3CRET) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  };