'use client';

import { useState } from 'react';

export function ApplyForm({ jobId, jobTitle }: { jobId: string, jobTitle: string }) {
    const [applied, setApplied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        resumeUrl: '',
        githubId: '', // Critical for AI Analysis
        linkedInUrl: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/v1/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId,
                    name: formData.name,
                    email: formData.email,
                    resumeUrl: formData.resumeUrl,
                    githubId: formData.githubId,
                    linkedInUrl: formData.linkedInUrl,
                    status: 'pending'
                })
            });

            if (!res.ok) throw new Error(await res.text());

            setApplied(true);
        } catch (err: any) {
            setError(err.message || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    if (applied) {
        return (
            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                <h3 className="text-xl font-bold text-green-400 mb-2">Application Submitted! 🎉</h3>
                <p className="text-slate-300">
                    We have received your application for <strong>{jobTitle}</strong>.
                    <br />
                    Our AI is now analyzing your profile. Good luck!
                </p>
                <div className="mt-4 text-sm text-slate-500">
                    (Administrative verification: Go to Admin Dashboard to run the analysis)
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                    <input
                        required
                        className="w-full bg-slate-800 border-white/10 rounded-lg px-3 py-2 text-white"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                    <input
                        required
                        type="email"
                        className="w-full bg-slate-800 border-white/10 rounded-lg px-3 py-2 text-white"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">GitHub Username <span className="text-violet-400">(Required for AI Analysis)</span></label>
                <input
                    required
                    className="w-full bg-slate-800 border-white/10 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g. torvalds"
                    value={formData.githubId}
                    onChange={e => setFormData({ ...formData, githubId: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Resume URL (PDF/Link)</label>
                <input
                    required
                    type="url"
                    className="w-full bg-slate-800 border-white/10 rounded-lg px-3 py-2 text-white"
                    placeholder="https://..."
                    value={formData.resumeUrl}
                    onChange={e => setFormData({ ...formData, resumeUrl: e.target.value })}
                />
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-bold text-white transition-colors disabled:opacity-50"
            >
                {loading ? 'Submitting...' : 'Submit Application'}
            </button>
        </form>
    );
}
