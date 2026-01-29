"use client";

import { useState } from "react";

type Props = {
    jobId: string;
    jobTitle: string;
};

export function ApplicationForm({ jobId, jobTitle }: Props) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        resumeUrl: "",
        linkedInUrl: "",
        portfolioUrl: "",
        githubId: "",
        leetcodeId: "",
        codeforcesId: "",
        coverLetter: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/v1/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, jobId })
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Failed to submit application");
            }

            setSuccess(true);
            // Reset form (optional)
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center text-green-400">
                <h3 className="text-xl font-bold mb-2">Application Received! 🎉</h3>
                <p>Thanks for applying to <strong>{jobTitle}</strong>. We'll be in touch soon.</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="mt-4 text-sm text-green-300 hover:underline"
                >
                    Submit another application
                </button>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 md:p-8">
            <h3 className="text-xl font-bold text-white mb-6">Apply for this role</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Full Name *</label>
                        <input
                            required
                            type="text"
                            placeholder="John Doe"
                            className="w-full bg-slate-800 border-white/10 rounded px-3 py-2 text-white text-sm focus:ring-violet-500 focus:border-violet-500"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Email *</label>
                        <input
                            required
                            type="email"
                            placeholder="john@example.com"
                            className="w-full bg-slate-800 border-white/10 rounded px-3 py-2 text-white text-sm"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                {/* URLs */}
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Resume / CV (URL) *</label>
                    <input
                        required
                        type="url"
                        placeholder="https://drive.google.com/..."
                        className="w-full bg-slate-800 border-white/10 rounded px-3 py-2 text-white text-sm"
                        value={formData.resumeUrl}
                        onChange={e => setFormData({ ...formData, resumeUrl: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Please provide a public link to your resume (Google Drive, Dropbox, etc)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">LinkedIn URL</label>
                        <input
                            type="url"
                            placeholder="https://linkedin.com/in/..."
                            className="w-full bg-slate-800 border-white/10 rounded px-3 py-2 text-white text-sm"
                            value={formData.linkedInUrl}
                            onChange={e => setFormData({ ...formData, linkedInUrl: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Portfolio / Website</label>
                        <input
                            type="url"
                            placeholder="https://johndoe.com"
                            className="w-full bg-slate-800 border-white/10 rounded px-3 py-2 text-white text-sm"
                            value={formData.portfolioUrl}
                            onChange={e => setFormData({ ...formData, portfolioUrl: e.target.value })}
                        />
                    </div>
                </div>

                {/* Coding Profiles - User Request */}
                <div className="pt-4 border-t border-white/10">
                    <p className="text-xs font-semibold text-violet-400 mb-3 uppercase tracking-wider">Coding Profiles</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">GitHub ID</label>
                            <input
                                type="text"
                                placeholder="octocat"
                                className="w-full bg-slate-800 border-white/10 rounded px-3 py-2 text-white text-sm"
                                value={formData.githubId}
                                onChange={e => setFormData({ ...formData, githubId: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">LeetCode ID</label>
                            <input
                                type="text"
                                placeholder="johndoe123"
                                className="w-full bg-slate-800 border-white/10 rounded px-3 py-2 text-white text-sm"
                                value={formData.leetcodeId}
                                onChange={e => setFormData({ ...formData, leetcodeId: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Codeforces ID</label>
                            <input
                                type="text"
                                placeholder="tourist"
                                className="w-full bg-slate-800 border-white/10 rounded px-3 py-2 text-white text-sm"
                                value={formData.codeforcesId}
                                onChange={e => setFormData({ ...formData, codeforcesId: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Cover Letter (Optional)</label>
                    <textarea
                        rows={4}
                        placeholder="Tell us why you're a fit..."
                        className="w-full bg-slate-800 border-white/10 rounded px-3 py-2 text-white text-sm"
                        value={formData.coverLetter}
                        onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}
                    />
                </div>

                {error && <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded">{error}</div>}

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-bold text-white transition-colors disabled:opacity-50"
                >
                    {loading ? "Submitting..." : "Submit Application"}
                </button>
            </form>
        </div>
    );
}
