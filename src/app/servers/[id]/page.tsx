'use client';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, FolderOpen, ShieldCheck } from 'lucide-react';
import StatsBar from '@/components/StatsBar';

const TerminalConsole = dynamic(() => import('@/components/TerminalConsole'), { 
    ssr: false,
    loading: () => (
        <div className="h-[450px] w-full bg-white/5 animate-pulse rounded-xl flex items-center justify-center text-gray-500 font-mono border border-white/5">
            Initializing Terminal...
        </div>
    )
});

export default function ServerConsolePage() {
    const params = useParams();
    const router = useRouter();
    const containerId = params.id as string;

    return (
        <main className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12">
            <div className="w-full">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push('/')}
                            className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Console Manager</h1>
                            <FolderOpen size={32} color='white' className="bg-zinc-750 hover:bg-zinc-800 hover:cursor-pointer p-0.5 rounded-sm" onClick={() => window.location.href = window.location.pathname + "/files"}/>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-1">
                                <ShieldCheck size={12} className="text-purple-500" />
                                <span>CONTAINER: {containerId.substring(0, 12)}</span>
                            </div>
                        </div>
                    </div>
                </header>
                <StatsBar containerId={containerId} />
                <TerminalConsole containerId={containerId} />
            </div>
        </main>
    );
}