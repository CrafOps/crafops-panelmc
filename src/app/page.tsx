'use client';
import { useEffect, useState } from 'react';
import ServerCard from '@/components/ServerCard';
import { MinecraftServer } from '@/types/server';
import { DockerService } from '@/service/docker.service';

export default function Dashboard() {
  const [servers, setServers] = useState<MinecraftServer[]>([]);

  const fetchServers = async () => {
    try {
      const data = await DockerService.listServers();
      setServers(data);
    } catch (err) {
      console.error("Failed to fetch", err)
    }
  }

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: any) => {
    await DockerService.powerAction(id, action);
    fetchServers();
};

  return (
    <main className="min-h-screen bg-[#0a0a0c] p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              MC-PANEL
            </h1>
            <p className="text-gray-400 mt-2">Manage your Bedrock servers with style.</p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20">
            + New Server
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onAction={handleAction}
              onDelete={(id) => console.log('Delete logic here', id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}