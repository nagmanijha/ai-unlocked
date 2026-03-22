import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { KnowledgeDocument, PaginatedResponse } from '../types';

export default function KnowledgePage() {
    const [docs, setDocs] = useState<PaginatedResponse<KnowledgeDocument> | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadDocuments(); }, []);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const data = await api.getDocuments({ page: 1, pageSize: 50 });
            setDocs(data);
        } catch (err) { console.error('Failed to load documents', err); }
        finally { setLoading(false); }
    };

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            for (const file of Array.from(files)) await api.uploadDocument(file);
            await loadDocuments();
        } catch (err) { console.error('Upload failed', err); }
        finally { setUploading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this document?')) return;
        try { await api.deleteDocument(id); await loadDocuments(); }
        catch (err) { console.error('Delete failed', err); }
    };

    const handleIndex = async (id: string) => {
        try { await api.triggerIndexing(id); await loadDocuments(); }
        catch (err) { console.error('Indexing failed', err); }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Knowledge Base</h1>
                    <p className="text-slate-400">Upload and manage RAG documents for AskBox AI responses</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadDocuments} className="bg-primary/10 px-4 py-2 rounded-lg text-sm font-bold border border-primary/20 flex items-center gap-2 text-slate-100">
                        <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                    </button>
                </div>
            </div>

            {/* Upload Area — editorial styled */}
            <div
                className={`rounded-2xl p-10 border-2 border-dashed transition-all cursor-pointer mb-8 ${dragActive ? 'border-primary bg-primary/10' : 'border-primary/20 hover:border-primary/40 bg-primary/5'
                    }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleUpload(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="flex flex-col items-center text-center">
                    {uploading ? (
                        <span className="material-symbols-outlined text-primary text-4xl animate-spin mb-3">progress_activity</span>
                    ) : (
                        <span className="material-symbols-outlined text-slate-500 text-4xl mb-3">cloud_upload</span>
                    )}
                    <p className="text-sm font-bold text-slate-300">
                        {uploading ? 'Uploading documents...' : 'Drop files here or click to browse'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Supports PDF, TXT, DOC, DOCX — Max 50MB per file</p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.doc,.docx"
                    multiple
                    onChange={(e) => handleUpload(e.target.files)}
                />
            </div>

            {/* Documents Grid */}
            <div className="bg-primary/5 rounded-2xl border border-primary/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-primary/10 flex items-center justify-between">
                    <span className="text-sm font-bold">{docs?.total || 0} Documents</span>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Azure AI Search Indexed</div>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
                    </div>
                ) : docs?.items.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">description</span>
                        <p>No documents uploaded yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-primary/10">
                        {docs?.items.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-primary/5 transition-colors">
                                <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{doc.originalName}</p>
                                    <p className="text-[10px] text-slate-500">
                                        {formatSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={doc.indexingStatus} />
                                </div>
                                <div className="flex items-center gap-1">
                                    {doc.indexingStatus !== 'indexing' && (
                                        <button
                                            onClick={() => handleIndex(doc.id)}
                                            className="size-8 rounded-lg hover:bg-primary/20 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                                            title="Trigger indexing"
                                        >
                                            <span className="material-symbols-outlined text-sm">search</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="size-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                                        title="Delete document"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        indexed: 'bg-accent-teal/10 text-accent-teal',
        indexing: 'bg-primary/10 text-primary',
        failed: 'bg-red-500/10 text-red-400',
        pending: 'bg-slate-500/10 text-slate-400',
    };
    const icons: Record<string, string> = {
        indexed: 'check_circle',
        indexing: 'progress_activity',
        failed: 'error',
        pending: 'schedule',
    };
    return (
        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${styles[status] || styles.pending}`}>
            <span className={`material-symbols-outlined text-sm ${status === 'indexing' ? 'animate-spin' : ''}`}>{icons[status] || 'schedule'}</span>
            {status}
        </span>
    );
}
