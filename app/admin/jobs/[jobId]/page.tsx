/* eslint-disable */
"use client";

import { useState, useEffect, use } from "react";

export default function JobDecompositionPage({ params }: { params: Promise<{ jobId: string }> }) {
    // Unwrap params using React.use()
    const { jobId } = use(params);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState("");

    const fetchDecomposition = async () => {
        try {
            const res = await fetch(`/api/v1/jobs/${jobId}/decomposition`);
            if (res.ok) {
                const json = await res.json();
                if (json.outcomes && json.outcomes.length > 0) {
                    setData(json);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchDecomposition();
    }, [jobId]);

    const handleDecompose = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/v1/jobs/${jobId}/decompose`, { method: "POST" });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed");
            }
            await fetchDecomposition();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        const res = await fetch(`/api/v1/jobs/${jobId}/decomposition/approve`, { method: "POST" });
        if (res.ok) alert("Approved!");
    };

    return (
        <div className="p-8 max-w-4xl mx-auto text-black dark:text-white">
            <h1 className="text-2xl font-bold mb-6">Job Decomposition Engine</h1>

            <div className="mb-8">
                <p className="text-gray-500 mb-2">Job ID: {jobId}</p>
                {!data && (
                    <button
                        onClick={handleDecompose}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Decomposing with Claude..." : "Start Decomposition AI"}
                    </button>
                )}
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>

            {data && (
                <div className="space-y-8">
                    {/* Signal Profile */}
                    <section className="bg-gray-100 p-4 rounded dark:bg-gray-800">
                        <h2 className="text-xl font-semibold mb-4">Signal Profile</h2>
                        <div className="grid grid-cols-5 gap-4">
                            {Object.entries(data.signal_profile || {}).map(([key, val]: any) => (
                                key !== "id" && key !== "jobId" && (
                                    <div key={key} className="text-center">
                                        <div className="text-2xl font-bold">{(val * 100).toFixed(0)}%</div>
                                        <div className="text-xs uppercase text-gray-500">{key.replace(/Weight/, "").replace(/([A-Z])/g, " $1")}</div>
                                    </div>
                                )
                            ))}
                        </div>
                    </section>

                    {/* Outcomes & Tasks */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Outcomes & Tasks</h2>
                        <div className="space-y-6">
                            {data.outcomes.map((outcome: any, i: number) => (
                                <div key={outcome.id} className="border p-4 rounded bg-white dark:bg-gray-900 shadow-sm">
                                    <h3 className="font-bold text-lg mb-2">Outcome {i + 1}: {outcome.description}</h3>
                                    <div className="pl-4 border-l-2 border-blue-200">
                                        {outcome.tasks.map((task: any, j: number) => (
                                            <div key={task.id} className="mt-2 text-sm">
                                                <span className="font-mono text-blue-600">[{task.taskType}]</span> {task.description}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <button
                        onClick={handleApprove}
                        className="px-6 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 w-full"
                    >
                        Approve Decomposition
                    </button>
                </div>
            )}
        </div>
    );
}
