'use client';
import { DockerService } from '@/service/docker.service';
import { useEffect, useRef, useState } from 'react';
import Terminal, { ColorMode, TerminalOutput } from 'react-terminal-ui';
import { io, Socket } from 'socket.io-client';

export default function TerminalConsole({ containerId }: { containerId: string }) {
    const socketRef = useRef<Socket | null>(null);
    const [lines, setLines] = useState<React.ReactNode[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    const cleanLogLine = (text: string) => {
        return text
            .replace(/\u001b\[[0-9;]*[mGJKHF]/g, '')
            .replace(/[^\x20-\x7E\u0E00-\u0E7F]/g, '')
            .trim();
    };

    useEffect(() => {
        setLines([
            <TerminalOutput key="init">
                <span style={{ color: '#22d3ee' }}>◆</span> Bridge established → {containerId.substring(0, 12)}
            </TerminalOutput>
        ]);

        const socket = io(DockerService.apiServer);
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('watch-logs', containerId);
        });

        socket.on('disconnect', () => setIsConnected(false));

        socket.on('log-data', (data: string) => {
            const newOutputs = data.split('\n')
                .map(line => cleanLogLine(line))
                .filter(line => line.length > 0)
                .map((line, i) => (
                    <TerminalOutput key={`${Date.now()}-${i}-${Math.random()}`}>
                        <span style={{ color: '#6b7280', fontSize: '11px', marginRight: '8px', fontFamily: 'monospace' }}>
                            {new Date().toLocaleTimeString('en-GB', { hour12: false })}
                        </span>
                        {line}
                    </TerminalOutput>
                ));
            setLines(prev => [...prev, ...newOutputs].slice(-200));
        });

        return () => { socket.disconnect(); };
    }, [containerId]);

    const handleInput = (input: string) => {
        if (!input.trim() || !socketRef.current) return;
        socketRef.current.emit('server-command', { containerId, command: input.trim() });
    };

    return (
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl"
            style={{ background: '#080a0e' }}>

            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]"
                style={{ background: '#0c0f14' }}>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/70" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <span className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <span className="text-xs font-mono text-gray-500 tracking-widest uppercase">
                        console — {containerId.substring(0, 12)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-[11px] font-mono text-gray-500">
                        {isConnected ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            <div className="pointer-events-none absolute inset-0 z-10 rounded-b-2xl"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
                    mixBlendMode: 'overlay',
                }} />

            <div style={{ background: '#080a0e' }}>
                <Terminal
                    name=""
                    colorMode={ColorMode.Dark}
                    onInput={handleInput}
                    height="520px"
                >
                    {lines}
                </Terminal>
            </div>
            <style>{`
    /* ซ่อน Header เดิมของ Library */
    .react-terminal-wrapper .react-terminal-window-buttons { display: none !important; }
    .react-terminal-wrapper > div:first-child { display: none !important; }

    /* ปรับแต่ง Scrollbar */
    .react-terminal-container::-webkit-scrollbar {
        width: 6px;
    }
    .react-terminal-container::-webkit-scrollbar-track {
        background: transparent;
    }
    .react-terminal-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
    .react-terminal-container::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    /* ปรับแต่ง Cursor ให้เป็นสี Cyan เหมือน Bridge */
    .react-terminal-line .react-terminal-active-input::after {
        background-color: #22d3ee !important;
        box-shadow: 0 0 8px #22d3ee;
    }

    /* ปรับ Font ให้คมชัดขึ้น */
    .react-terminal-line {
        font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
        line-height: 1.6 !important;
        text-shadow: 0 0 2px rgba(255,255,255,0.1);
    }
`}</style>
            {/* <style>{`
  .react-terminal-wrapper .react-terminal-window-buttons { display: none !important; }
  .react-terminal-wrapper > div:first-child { display: none !important; }
`}</style> */}
        </div>
    );
}