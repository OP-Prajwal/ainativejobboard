import prisma from '@/lib/prisma';
import { JobCard } from '@/components/JobCard';
import { Metadata } from 'next';
import Link from 'next/link';
import { JOB_CATEGORIES } from '@/lib/seo-config';

export const metadata: Metadata = {
    title: 'All Jobs | FinalRoundAI',
    description: 'Browse thousands of tech jobs at top companies.',
};

// Force dynamic rendering to always get fresh jobs
export const dynamic = 'force-dynamic';

export default async function JobsPage() {
    // 1. Fetch Active Jobs from Real DB
    const allJobs = await prisma.job.findMany({
        where: {
            status: 'active',
        },
        include: {
            company: true
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // 2. Use SEO Config Categories (Single Source of Truth)
    const categories = Object.keys(JOB_CATEGORIES).map(slug => ({
        slug,
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));

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
                            {cat.name}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {allJobs.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="text-slate-500 mb-2">No active jobs found</div>
                        <p className="text-sm text-slate-600">Check back later or post a job via Admin.</p>
                    </div>
                ) : (
                    allJobs.map((job) => (
                        // @ts-ignore
                        <JobCard key={job.id} job={job} />
                    ))
                )}
            </div>
        </div>
    );
}
