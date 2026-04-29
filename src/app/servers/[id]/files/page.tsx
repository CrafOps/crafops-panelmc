'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Folder, File, ChevronRight, HardDrive, Save, Trash2,
    FilePlus, FolderPlus, RefreshCw, X, Upload, ArrowLeft,
    HomeIcon
} from 'lucide-react';
import { DockerService } from '@/service/docker.service';

export default function FileManager({ params }: { params: Promise<{ id: string }> }) {
    const { id: containerId } = React.use(params);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [files, setFiles] = useState([]);
    const [currentPath, setCurrentPath] = useState('/data');
    const [editingFile, setEditingFile] = useState<{ path: string, content: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const showNotify = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const loadFiles = useCallback(async (path: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${DockerService.apiServer}/servers/${containerId}/files?path=${path}`);
            
            if (res.status === 500) {
                const errorData = await res.json();
                if (errorData.error === "SERVER_OFFLINE") {
                    setFiles([]); // เคลียร์ไฟล์
                    showNotify('เซิร์ฟเวอร์ปิดอยู่ ไม่สามารถดึงข้อมูลไฟล์ได้', 'error');
                    return;
                }
            }
    
            const data = await res.json();
            setFiles(data);
        } catch (err) {
            showNotify('Failed to load files', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [containerId]);

    // const loadFiles = useCallback(async (path: string) => {
    //     setIsLoading(true);
    //     try {
    //         const res = await fetch(`${DockerService.apiServer}/servers/${containerId}/files?path=${path}`);
    //         const data = await res.json();
    //         setFiles(data.sort((a: any, b: any) => (b.isDirectory ? 1 : -1) - (a.isDirectory ? 1 : -1)));
    //         setCurrentPath(path);
    //     } catch (err) {
    //         showNotify('Failed to load files', 'error');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // }, [containerId]);

    const handleBack = () => {
        if (currentPath === '/data' || currentPath === '/') return;
        const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
        loadFiles(parent);
    };

    const openFile = async (path: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${DockerService.apiServer}/servers/${containerId}/files/content?path=${path}`);
            const data = await res.json();
            setEditingFile({ path, content: data.content });
        } catch (err) {
            showNotify('Could not read file', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingFile) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${DockerService.apiServer}/servers/${containerId}/files/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: editingFile.path, content: editingFile.content })
            });
            if (res.ok) showNotify('File saved successfully');
        } catch (err) {
            showNotify('Save failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Delete ${path.split('/').pop()}?`)) return;
        try {
            const res = await fetch(`${DockerService.apiServer}/servers/${containerId}/files/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            });
            if (res.ok) {
                showNotify('Deleted');
                loadFiles(currentPath);
            }
        } catch (err) {
            showNotify('Delete failed', 'error');
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${DockerService.apiServer}/servers/${containerId}/files/upload?path=${currentPath}`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                showNotify('Upload complete');
                loadFiles(currentPath);
            }
        } catch (err) {
            showNotify('Upload failed', 'error');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCreate = async (type: 'file' | 'folder') => {
        const name = prompt(`Enter ${type} name:`);
        if (!name) return;
        const endpoint = type === 'file' ? 'create' : 'create-folder';

        try {
            const res = await fetch(`${DockerService.apiServer}/servers/${containerId}/files/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: currentPath, name })
            });
            if (res.ok) {
                showNotify(`${type === 'file' ? 'File' : 'Folder'} created`);
                loadFiles(currentPath);
            }
        } catch (err) {
            showNotify('Creation failed', 'error');
        }
    };

    useEffect(() => { loadFiles('/data'); }, [loadFiles]);

    return (
        <div className="flex h-screen bg-[#08090c] text-gray-300 font-sans overflow-hidden">
            {/* Notification Toast */}
            {message && (
                <div className={`fixed top-5 right-5 z-[100] px-6 py-3 rounded-xl border shadow-2xl transition-all animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    <div className="flex items-center gap-3 font-bold text-sm">
                        <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {message.text}
                    </div>
                </div>
            )}

            {/* Sidebar Explorer */}
            <div className="w-72 border-r border-white/5 flex flex-col bg-[#0c0d11] select-none">
                <div className="p-4 flex flex-col gap-4 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                        <HomeIcon onClick={() => {
                            const newPath = window.location.pathname.replace(/\/files$/, "");
                            window.location.href = newPath || "/"; }}
                        className='p-1 hover:bg-white/10 rounded-md disabled:opacity-20 transition-colors hover:cursor-pointer'
                        />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBack}
                                disabled={currentPath === '/data' || currentPath === '/'}
                                className="p-1 hover:bg-white/10 rounded-md disabled:opacity-20 transition-colors hover:cursor-pointer"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Explorer</span>
                        </div>
                        <button onClick={() => loadFiles(currentPath)} className={isLoading ? 'animate-spin text-cyan-400' : 'text-gray-500 hover:text-white hover:cursor-pointer'}>
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    <div className="flex justify-between p-1 bg-black/20 rounded-lg border border-white/5">
                        <button onClick={() => handleCreate('file')} className="p-2 hover:bg-white/5 rounded-md text-cyan-400" title="New File"><FilePlus size={16} /></button>
                        <button onClick={() => handleCreate('folder')} className="p-2 hover:bg-white/5 rounded-md text-yellow-500" title="New Folder"><FolderPlus size={16} /></button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/5 rounded-md text-emerald-400" title="Upload"><Upload size={16} /></button>
                        <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {files.map((file: any) => (
                        <div
                            key={file.path}
                            onClick={() => file.isDirectory ? loadFiles(file.path) : openFile(file.path)}
                            className="flex items-center group px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer text-sm transition-all"
                        >
                            {file.isDirectory ?
                                <Folder size={16} className="mr-2 text-yellow-500/70 fill-yellow-500/5" /> :
                                <File size={16} className="mr-2 text-blue-400/80" />
                            }
                            <span className="flex-1 truncate font-mono text-[12px]">{file.name}</span>
                            <button onClick={(e) => handleDelete(file.path, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-colors">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col bg-[#08090c]">
                {editingFile ? (
                    <div className="flex flex-col h-full">
                        <div className="flex bg-[#0c0d11] border-b border-white/5 h-10 select-none">
                            <div className="bg-[#08090c] border-t-2 border-t-cyan-500 px-4 flex items-center gap-3 text-xs shadow-xl">
                                <File size={12} className="text-cyan-400" />
                                <span className="text-gray-200">{editingFile.path.split('/').pop()}</span>
                                <X size={12} className="ml-2 cursor-pointer hover:text-red-400" onClick={() => setEditingFile(null)} />
                            </div>
                        </div>

                        <div className="px-6 py-2 flex justify-between items-center bg-white/[0.01] border-b border-white/[0.03]">
                            <span className="text-[10px] font-mono text-gray-600 truncate max-w-[400px]">{editingFile.path}</span>
                            <button
                                onClick={handleSave}
                                className="bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-lg shadow-cyan-900/20 active:scale-95 transition-all"
                            >
                                <Save size={12} className="inline mr-2" />
                                SAVE CHANGES
                            </button>
                        </div>

                        <textarea
                            className="flex-1 w-full bg-transparent p-8 font-mono text-[13px] outline-none resize-none text-gray-300 leading-relaxed custom-scrollbar editor-bg"
                            value={editingFile.content}
                            spellCheck={false}
                            onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-20 select-none">
                        <HardDrive size={64} strokeWidth={1} />
                        <p className="mt-4 font-mono text-[10px] tracking-[0.3em] uppercase">{currentPath}</p>
                    </div>
                )}
            </div>
        </div>
    );
}