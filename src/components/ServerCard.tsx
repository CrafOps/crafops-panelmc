'use client';
import { Play, Square, Trash2, Server as ServerIcon, Terminal as TerminalIcon, Wifi } from 'lucide-react';
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
            className="relative overflow-hidden group w-full rounded-2xl border border-white/[0.06] cursor-pointer transition-all duration-300 hover:border-white/[0.12]"
            style={{ background: '#0c0f14' }}
        >
            <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-[60px] transition-opacity duration-500 pointer-events-none ${isRunning ? 'bg-emerald-500 opacity-10 group-hover:opacity-20' : 'bg-red-500 opacity-5 group-hover:opacity-10'}`} />

            <div className={`absolute top-0 left-0 right-0 h-px transition-colors duration-300 ${isRunning ? 'bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent' : 'bg-gradient-to-r from-transparent via-red-500/30 to-transparent'}`} />

            <div className="relative z-10 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`shrink-0 p-2.5 rounded-xl ${isRunning ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                            <ServerIcon size={20} className={isRunning ? 'text-emerald-400' : 'text-red-400'} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-mono font-medium text-white truncate group-hover:text-white/90 transition-colors">
                                {server.name}
                            </h3>
                            <p className="text-xs text-gray-600 truncate mt-0.5">{server.status}</p>
                        </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAction(server.id, isRunning ? 'stop' : 'start'); }}
                            className={`p-2 rounded-lg transition-all duration-200 ${isRunning ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                        >
                            {isRunning ? <Square size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(server.id, server.name); }}
                            className="p-2 rounded-lg bg-white/[0.03] text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/[0.04] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/[0.04]">
                            <Wifi size={11} className="text-gray-600" />
                            <span className="text-[11px] font-mono text-gray-400">
                                {server.ports[0]?.public || '19132'}/UDP
                            </span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/[0.04] ${isRunning ? 'bg-emerald-500/[0.08]' : 'bg-red-500/[0.06]'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-400/60'}`} />
                            <span className={`text-[11px] font-mono uppercase tracking-wider ${isRunning ? 'text-emerald-400' : 'text-red-400/70'}`}>
                                {server.state}
                            </span>
                        </div>
                    </div>
                    <TerminalIcon size={14} className="text-gray-700 group-hover:text-gray-500 transition-colors shrink-0" />
                </div>
            </div>
        </div>
    );
}