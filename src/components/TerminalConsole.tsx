'use client';
import { DockerService } from '@/service/docker.service';
import { useEffect, useRef, useState } from 'react';
import Terminal, { ColorMode, TerminalOutput } from 'react-terminal-ui';
import { io, Socket } from 'socket.io-client';

export default function TerminalConsole({ containerId }: { containerId: string }) {
    const socketRef = useRef<Socket | null>(null);
    const [lines, setLines] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        setLines([<TerminalOutput key="init">Connecting to {containerId.substring(0, 8)}...</TerminalOutput>]);

        const socket = io(DockerService.apiServer.toString());
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('watch-logs', containerId);
        });

        socket.on('log-data', (data: string) => {
            const cleanData = data.replace(/\u001b\[[0-9;]*[mGJK]/g, ''); 
            
            const newLines = cleanData.split('\n')
                .filter(l => l.trim() !== '')
                .map((line, i) => (
                    <TerminalOutput key={`${Date.now()}-${i}-${Math.random()}`}>
                        {line}
                    </TerminalOutput>
                ));

            setLines(prev => [...prev, ...newLines].slice(-100));
        });

        return () => {
            socket.disconnect();
        };
    }, [containerId]);

    const handleInput = (input: string) => {
        if (!input.trim() || !socketRef.current) return;

        socketRef.current.emit('server-command', {
            containerId,
            command: input.trim()
        });
    };

    return (
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#1a1a1b]">
            <Terminal name={`Console — ${containerId.substring(0, 12)}`} colorMode={ColorMode.Dark} onInput={handleInput} height="500px">
                {lines}
            </Terminal>
        </div>
    );
}