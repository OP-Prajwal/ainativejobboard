
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
    params: Promise<{ slug: string }>;
};

export default async function CompanyDashboardPage({ params }: Props) {
    const slug = (await params).slug;

    const company = await prisma.company.findUnique({
        where: { slug: slug.toLowerCase() },
        include: {
            jobs: {
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!company) {
        // In a real app, maybe redirect to a "Claim this Company" page
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-12 pb-8 border-b border-white/10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{company.name} Dashboard</h1>
                        <p className="text-slate-400">Manage your jobs and candidates</p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href={`/companies/${company.slug}`}
                            target="_blank"
                            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-white/5"
                        >
                            View Public Page ↗
                        </Link>
                        <Link
                            href={`/admin/jobs/new?company=${encodeURIComponent(company.name)}`}
                            className="px-6 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/20"
                        >
                            + Post a Job
                        </Link>
                    </div>
                </div>

                {/* Stats / Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
                        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Active Jobs</h3>
                        <p className="text-4xl font-bold text-white">{company.jobs.length}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
                        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Total Views</h3>
                        <p className="text-4xl font-bold text-white">--</p>
                        <span className="text-xs text-slate-500">(Analytics coming soon)</span>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
                        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Candidates</h3>
                        <p className="text-4xl font-bold text-white">0</p>
                    </div>
                </div>

                {/* Job List Management */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-6">Your Jobs</h2>
                    <div className="bg-slate-900/30 rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/80 text-slate-400 text-sm font-medium">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Posted</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {company.jobs.length > 0 ? company.jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{job.title}</div>
                                            <div className="text-sm text-slate-500">{job.location} • {job.type}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/jobs/view/${job.slug}`} className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            No jobs posted yet. <Link href={`/admin/jobs/new?company=${encodeURIComponent(company.name)}`} className="text-violet-400 underline">Post your first one!</Link>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
