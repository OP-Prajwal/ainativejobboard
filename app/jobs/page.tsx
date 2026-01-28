import { db } from '@/lib/mock-db';
import { JobCard } from '@/components/JobCard';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'All Jobs | FinalRoundAI',
    description: 'Browse thousands of tech jobs at top companies.',
};

export default function JobsPage() {
    const allJobs = db.getAllJobs();
    const categories = db.getAllCategories();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-500">
                Find Your Next Role
            </h1>

            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4 text-slate-300">Browse by Category</h2>
                <div className="flex flex-wrap gap-3">
                    {categories.map((cat) => (
                        <Link
                            key={cat.slug}
                            href={`/jobs/${cat.slug}`}
                            className="px-4 py-2 rounded-lg bg-slate-800 border border-white/5 hover:bg-slate-700 hover:border-violet-500/50 transition-all text-sm font-medium text-slate-300 hover:text-white"
                        >
                            {cat.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {allJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}
            </div>
        </div>
    );
}
