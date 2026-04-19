import axios from 'axios';

const API_URI = 'http://localhost:8080';

export const DockerService = {

    apiServer: async () => {
        return API_URI;
    },

    // ดึงรายการเซิร์ฟเวอร์ทั้งหมด
    listServers: async () => {
        const response = await axios.get(`${API_URI}/servers`);
        return response.data;
    },

    // สร้างเซิร์ฟเวอร์ใหม่
    createServer: async (serverName: string, port: number) => {
        const response = await axios.post(`${API_URI}/servers/create`, {
            serverName,
            port
        });
        return response.data;
    },

    // สั่ง Start / Stop / Restart
    powerAction: async (containerId: string, action: 'start' | 'stop' | 'restart') => {
        const response = await axios.post(`${API_URI}/servers/power/${action}`, {
            containerId
        });
        return response.data;
    },

    // ลบเซิร์ฟเวอร์
    deleteServer: async (containerId: string, serverName: string, deleteData: boolean = false) => {
        const response = await axios.delete(`${API_URI}/servers/delete`, {
            data: { containerId, serverName, deleteData }
        });
        return response.data;
    }
};