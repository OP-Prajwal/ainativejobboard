import Link from 'next/link';
import { Job } from '@/lib/mock-db';

export function JobCard({ job }: { job: Job }) {
    return (
        <div className="group relative p-6 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-800/50 transition-all duration-300 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10">
            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-400 group-hover:text-white group-hover:bg-violet-600/20 transition-colors">
                        {job.company.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-slate-100 group-hover:text-violet-400 transition-colors">
                            <Link href={`/jobs/view/${job.slug}`} className="before:absolute before:inset-0">
                                {job.title}
                            </Link>
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">{job.company.name}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-white/5">
                        {job.location}
                    </span>
                    <span className="text-xs text-slate-500">
                        {new Date(job.postedAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded text-xs font-medium text-blue-400 bg-blue-400/10 border border-blue-400/20">
                    {job.subcategory}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20">
                    {job.type}
                </span>
            </div>
        </div>
    );
}
