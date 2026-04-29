'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Cpu, Database, Activity, Globe } from 'lucide-react';
import { DockerService } from '@/service/docker.service';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    unit?: string;
    max?: number;
    accentColor: string;
    glowColor: string;
}

function StatCard({ icon, label, value, unit, max, accentColor, glowColor }: StatCardProps) {
    const safeValue = isNaN(Number(value)) ? 0 : Number(value);
    const safeMax = isNaN(Number(max)) || Number(max) === 0 ? 1 : Number(max);
    const pct = max ? Math.min(100, (safeValue / safeMax) * 100) : null;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-5 group transition-all duration-300 hover:border-white/[0.12]"
            style={{ background: '#0c0f14' }}>

            <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: glowColor }} />

            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg" style={{ background: `${accentColor}18` }}>
                        <div style={{ color: accentColor }}>{icon}</div>
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-gray-600">{label}</span>
                </div>
            </div>

            <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-mono font-medium text-white tabular-nums"
                    style={{ textShadow: `0 0 20px ${accentColor}40` }}>
                    {String(value)}
                </span>
                {unit && <span className="text-sm font-mono text-gray-600">{unit}</span>}
            </div>

            {pct !== null && (
                <div className="h-px w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})`,
                        }} />
                </div>
            )}
        </div>
    );
}

export default function StatsBar({ containerId }: { containerId: string }) {
    const [stats, setStats] = useState({ ip: '—', cpu: 0, ramUsage: 0, ramLimit: 0 });

    useEffect(() => {
        const socket = io(DockerService.apiServer);
        socket.emit('watch-logs', containerId);
        
        socket.on('stats-data', (data) => {
            setStats({
                ip: data?.ip || '—',
                cpu: isNaN(Number(data?.cpu)) ? 0 : Number(data?.cpu),
                ramUsage: isNaN(Number(data?.ramUsage)) ? 0 : Number(data?.ramUsage),
                ramLimit: isNaN(Number(data?.ramLimit)) ? 0 : Number(data?.ramLimit)
            });
        });

        return () => { socket.disconnect(); };
    }, [containerId]);

    const displayRamUsage = Math.round(stats.ramUsage);
    const displayRamLimit = Math.round(stats.ramLimit) || 1024;
    const displayCpu = stats.cpu.toFixed(1);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
                icon={<Globe size={15} />}
                label="Server IP"
                value={stats.ip}
                accentColor="#22d3ee"
                glowColor="#22d3ee"
            />
            <StatCard
                icon={<Cpu size={15} />}
                label="CPU Load"
                value={displayCpu}
                unit="%"
                max={100}
                accentColor="#a78bfa"
                glowColor="#7c3aed"
            />
            <StatCard
                icon={<Database size={15} />}
                label="Memory"
                value={displayRamUsage}
                unit="MB"
                max={displayRamLimit}
                accentColor="#60a5fa"
                glowColor="#2563eb"
            />
            <StatCard
                icon={<Activity size={15} />}
                label="Mem Limit"
                value={displayRamLimit}
                unit="MB"
                accentColor="#34d399"
                glowColor="#059669"
            />
        </div>
    );
}