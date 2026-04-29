'use client';
import { useEffect, useState } from 'react';
import { DockerService } from '@/service/docker.service';
import { X, Server, Hash, Zap, Cpu, Box, ChevronDown } from 'lucide-react';

export default function CreateServerModal({ onClose, onRefresh }: any) {
    const [loading, setLoading] = useState(false);
    const [javaVersions, setJavaVersions] = useState<{label: string, value: string}[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        port: '19132',
        serverType: 'bedrock',
        version: 'LATEST'
    });

    // ดึงข้อมูล Java Versions จาก API Meta ที่เราสร้างไว้
    useEffect(() => {
        fetch(`${DockerService.apiServer}/meta/java-versions`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setJavaVersions(data);
            })
            .catch(err => console.error("Failed to fetch meta:", err));
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        
        setLoading(true);
        try {
            const response = await fetch(`${DockerService.apiServer}/servers/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serverName: formData.name.replace(/\s+/g, '-').toLowerCase(),
                    port: parseInt(formData.port),
                    serverType: formData.serverType,
                    version: formData.version
                }),
            });

            if (response.ok) {
                onRefresh();
                onClose();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to create server');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleTypeChange = (type: string) => {
        const defaultPort = type === 'java' ? '25565' : '19132';
        setFormData({ ...formData, serverType: type, port: defaultPort, version: 'LATEST' });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
            <div className="bg-[#0c0f14] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <Cpu className="text-cyan-400" size={18} />
                        <span className="font-bold text-gray-200">Deploy New Instance</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleCreate} className="p-6 space-y-4">
                    {/* Instance Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1.5 ml-1">
                            <Zap size={12} /> Instance Name
                        </label>
                        <input 
                            required
                            autoFocus
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-gray-700"
                            placeholder="my-cool-server"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Server Type Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1.5 ml-1">
                                <Box size={12} /> Server Type
                            </label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                                    value={formData.serverType}
                                    onChange={(e) => handleTypeChange(e.target.value)}
                                >
                                    <option value="bedrock">Bedrock (MCPE)</option>
                                    <option value="java">Java Edition (PC)</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Version Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1.5 ml-1">
                                <Hash size={12} /> Version
                            </label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                                    value={formData.version}
                                    onChange={(e) => setFormData({...formData, version: e.target.value})}
                                >
                                    <option value="LATEST">Latest Release</option>
                                    {formData.serverType === 'java' ? (
                                        javaVersions.map((v) => (
                                            <option key={v.value} value={v.value}>{v.label}</option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="1.21.0">1.21.0</option>
                                            <option value="1.20.80">1.20.80</option>
                                            <option value="1.19.0">1.19.0</option>
                                        </>
                                    )}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* External Port */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1.5 ml-1">
                            <Hash size={12} /> External Port {formData.serverType === 'java' ? '(TCP)' : '(UDP)'}
                        </label>
                        <input 
                            required
                            type="number"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-all font-mono"
                            value={formData.port}
                            onChange={(e) => setFormData({...formData, port: e.target.value})}
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={loading}
                            className="flex-[2] px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Deploying...</span>
                                </>
                            ) : 'Deploy Server'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}