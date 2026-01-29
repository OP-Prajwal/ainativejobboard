"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Specific component to handle logic inside Suspense
function CreateJobForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefilledCompany = searchParams.get("company") || "";

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "Full-time",
        location: "Remote",
        salary: "",
        category: "software-engineering",
        subcategory: "",
        companyName: prefilledCompany,
        skills: "", // comma separated
        experienceLevel: "Entry-level",
        autoGenerate: true,
    });

    // Update if URL param changes
    useEffect(() => {
        if (prefilledCompany) {
            setFormData(prev => ({ ...prev, companyName: prefilledCompany }));
        }
    }, [prefilledCompany]);

    const [manualTasks, setManualTasks] = useState<
        { description: string; type: string }[]
    >([]);

    const handleTaskAdd = () => {
        setManualTasks([...manualTasks, { description: "", type: "PRODUCTION_LIKE" }]);
    };

    const handleTaskChange = (index: number, field: string, value: string) => {
        const newTasks = [...manualTasks];
        // @ts-ignore
        newTasks[index][field] = value;
        setManualTasks(newTasks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const skillsArray = formData.skills.split(",").map((s) => s.trim()).filter((s) => s);

            const payload = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                location: formData.location,
                salary: formData.salary,
                category: formData.category,
                subcategory: formData.subcategory,
                companyName: formData.companyName,
                experienceLevel: formData.experienceLevel,
                skills: skillsArray,
                manualTasks: formData.autoGenerate ? [] : manualTasks,
            };

            const res = await fetch("/api/v1/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = await res.json();
            // Redirect to the new SEO-friendly URL: /jobs/view/[slug]
            // We need to fetch the job first or trust the backend return.
            // Ideally backend returns the slug.
            router.push(`/jobs/view/${data.slug}`);
        } catch (err: any) {
            setError(err.message || "Failed to create job");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8 text-white">Post a New Job</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/50 p-8 rounded-xl border border-white/10">

                {/* Basic Info */}
                {/* Basic Info */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Job Title</label>
                    <input
                        required
                        type="text"
                        className="w-full bg-slate-800 border-white/10 rounded-lg px-4 py-2 text-white focus:ring-violet-500 focus:border-violet-500"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Company Name</label>
                    <input
                        required
                        type="text"
                        placeholder="e.g. Stripe, Airbnb"
                        className="w-full bg-slate-800 border-white/10 rounded-lg px-4 py-2 text-white focus:ring-violet-500 focus:border-violet-500"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Location</label>
                        <input
                            type="text"
                            placeholder="e.g. Remote, San Francisco"
                            className="w-full bg-slate-800 border-white/10 rounded-lg px-4 py-2 text-white"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Salary Range</label>
                        <input
                            type="text"
                            placeholder="e.g. $120k - $160k"
                            className="w-full bg-slate-800 border-white/10 rounded-lg px-4 py-2 text-white"
                            value={formData.salary}
                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Job Type</label>
                        <select
                            className="w-full bg-slate-800 border-white/10 rounded-lg px-4 py-2 text-white"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                            <option value="Freelance">Freelance</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Experience Level</label>
                        <select
                            className="w-full bg-slate-800 border-white/10 rounded-lg px-4 py-2 text-white"
                            value={formData.experienceLevel}
                            onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                        >
                            <option value="Intern">Intern</option>
                            <option value="Entry-level">Entry-level</option>
                            <option value="Associate">Associate</option>
                            <option value="Mid-level">Mid-level</option>
                            <option value="Senior">Senior</option>
                            <option value="Staff">Staff</option>
                            <option value="Lead">Lead</option>
                            <option value="Executive">Executive</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Category (SEO)</label>
                        <select
                            className="w-full bg-slate-800 border-white/10 rounded-lg px-4 py-2 text-white"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="software-engineering">Software Engineering</option>
                            <option value="data-science-analytics">Data Science & Analytics</option>
                            <option value="product-management">Product Management</option>
                            <option value="sales-business-dev">Sales & Business Dev</option>
                            <option value="marketing">Marketing</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Subcategory (SEO)</label>
                        <input
                            placeholder="e.g. backend-developer"
                            className="w-full bg-slate-800 border-white/10 rounded-lg px-4 py-2 text-white"
                            value={formData.subcategory}
                            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                    <textarea
                        required
                        rows={6}
                        className="w-full bg-slate-800 border-white/10 rounded-lg px-4 py-2 text-white"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Skills */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Explicit Skills (Auto-Detection Priority)</label>
                    <input
                        placeholder="React, Node.js, System Design, Communication..."
                        className="w-full bg-slate-800 border-white/10 rounded-lg px-4 py-2 text-white"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    />
                    <p className="text-xs text-slate-500 mt-1">Comma separated. AI will prioritize validating these skills.</p>
                </div>

                {/* Task Generation Control */}
                <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-white font-medium">Tasks & Challenges</span>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-400">Auto-Generate with AI?</label>
                            <input
                                type="checkbox"
                                checked={formData.autoGenerate}
                                onChange={(e) => setFormData({ ...formData, autoGenerate: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-600 text-violet-600 focus:ring-violet-500"
                            />
                        </div>
                    </div>

                    {!formData.autoGenerate && (
                        <div className="space-y-4">
                            {manualTasks.map((task, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        placeholder="Task Description"
                                        className="flex-1 bg-slate-800 border-white/10 rounded px-3 py-2 text-sm text-white"
                                        value={task.description}
                                        onChange={(e) => handleTaskChange(idx, 'description', e.target.value)}
                                    />
                                    <select
                                        className="bg-slate-800 border-white/10 rounded px-3 py-2 text-sm text-white"
                                        value={task.type}
                                        onChange={(e) => handleTaskChange(idx, 'type', e.target.value)}
                                    >
                                        <option value="DIAGNOSTIC">Diagnostic</option>
                                        <option value="PROBING">Probing</option>
                                        <option value="PRODUCTION_LIKE">Production</option>
                                    </select>
                                </div>
                            ))}
                            <button type="button" onClick={handleTaskAdd} className="text-sm text-violet-400 hover:text-violet-300">
                                + Add Task
                            </button>
                        </div>
                    )}

                    {formData.autoGenerate && (
                        <div className="p-4 bg-violet-500/10 rounded-lg border border-violet-500/20 text-violet-200 text-sm">
                            ✨ Artificial Intelligence will analyze the description and skills to generate 5 progressive interview tasks automatically.
                        </div>
                    )}
                </div>

                {error && <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded">{error}</div>}

                <div className="flex justify-end pt-4">
                    <button
                        disabled={loading}
                        type="submit"
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Post Job"}
                    </button>
                </div>

            </form>
        </div>
    );
}

export default function CreateJobPage() {
    return (
        <Suspense fallback={<div className="text-white p-8">Loading form...</div>}>
            <CreateJobForm />
        </Suspense>
    );
}
