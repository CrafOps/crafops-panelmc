'use client';
import { Play, Square, Trash2, Server as ServerIcon, Terminal as TerminalIcon } from 'lucide-react';
import { MinecraftServer } from '@/types/server';
import { useRouter } from 'next/navigation';

interface Props {
    server: MinecraftServer;
    onAction: (id: string, action: string) => void;
    onDelete: (id: string, name: string) => void;
}

export default function ServerCard({ server, onAction, onDelete }: Props) {
    const router = useRouter();
    const isRunning = server.state === 'running';

    return (
        <div 
            onClick={() => router.push(`/servers/${server.id}`)}
            className="relative overflow-hidden group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 transition-all hover:bg-white/10 hover:border-purple-500/50 shadow-xl cursor-pointer"
        >
            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[80px] opacity-20 transition-colors ${isRunning ? 'bg-green-500' : 'bg-red-500'}`} />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${isRunning ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        <ServerIcon size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{server.name}</h3>
                        <p className="text-sm text-gray-400">{server.status}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction(server.id, isRunning ? 'stop' : 'start');
                        }}
                        className={`p-2 rounded-lg transition-all ${isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-green-500/20 text-green-400 hover:bg-green-400/40'}`}
                    >
                        {isRunning ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>
                    
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(server.id, server.name);
                        }}
                        className="p-2 rounded-lg bg-gray-500/10 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between relative z-10">
                <div className="flex gap-3 text-xs font-mono text-gray-300">
                    <div className="bg-black/30 px-3 py-1 rounded-full border border-white/5">
                        PORT: {server.ports[0]?.public || '19132'} (UDP)
                    </div>
                    <div className={`px-3 py-1 rounded-full border border-white/5 uppercase ${isRunning ? 'text-green-400' : 'text-red-400'}`}>
                        {server.state}
                    </div>
                </div>
                <TerminalIcon size={16} className="text-gray-600 group-hover:text-purple-500 transition-colors" />
            </div>
        </div>
    );
}