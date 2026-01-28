import { db } from '@/lib/mock-db';
import { JobCard } from '@/components/JobCard';
import { notFound } from 'next/navigation';
import {
    generateCategoryTitle,
    generateCategoryDescription,
    generateLocationTitle,
    generateCategoryLocationTitle,
    generateSubCategoryTitle
} from '@/lib/seo';
import { Metadata } from 'next';

type Props = {
    params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const slug = (await params).slug;
    const jobs = await getJobs(slug);
    const count = jobs.length;

    if (slug.length === 1) {
        // CASE 1: Location (/jobs/in-austin-tx)
        if (slug[0].startsWith('in-')) {
            const locName = jobs[0]?.location || slug[0]; // Fallback if no jobs
            return {
                title: generateLocationTitle(locName, count),
                description: `Find ${count} jobs in ${locName}.`
            };
        }

        // CASE 2: Category (/jobs/software-engineering) OR Subcategory (/jobs/frontend-developer)
        const catType = db.getCategoryType(slug[0]);
        if (catType === 'main') {
            // Main Category
            return {
                title: generateCategoryTitle(slug[0].replace(/-/g, ' '), count),
                description: generateCategoryDescription(slug[0].replace(/-/g, ' '), count)
            };
        } else if (catType === 'sub') {
            // Subcategory (Top Level Route as per user request example)
            return {
                title: generateSubCategoryTitle(slug[0].replace(/-/g, ' '), count),
                description: `Browse ${count} ${slug[0].replace(/-/g, ' ')} positions.`
            };
        }
    }

    if (slug.length === 2) {
        // CASE 3: Category + Location (/jobs/software-engineering/in-austin-tx)
        // OR Subcategory + Location (Not explicitly asked but logic supports it)
        const category = slug[0];
        const location = slug[1];
        if (location.startsWith('in-')) {
            return {
                title: generateCategoryLocationTitle(category.replace(/-/g, ' '), location.replace('in-', '').replace(/-/g, ' '), count),
                description: `Find ${count} ${category} jobs in ${location}.`
            };
        }
    }

    return {
        title: 'Job Search | FinalRoundAI',
        description: 'Find your next job.'
    };
}

async function getJobs(slug: string[]) {
    if (slug.length === 1) {
        const param = slug[0];
        if (param.startsWith('in-') || param === 'remote') {
            return db.getJobsByLocation(param);
        }
        // Try Category then Subcategory
        const byCat = db.getJobsByCategory(param);
        if (byCat.length > 0) return byCat;

        const bySub = db.getJobsBySubcategory(param);
        if (bySub.length > 0) return bySub;

        return [];
    }

    if (slug.length === 2) {
        const [catOrSub, loc] = slug;
        if (!loc.startsWith('in-') && loc !== 'remote') return [];

        // Try Main Category + Loc
        const catJobs = db.getJobsByCategoryAndLocation(catOrSub, loc);
        if (catJobs.length > 0) return catJobs;

        // Try Subcategory + Loc
        const subJobs = db.getJobsBySubcategoryAndLocation(catOrSub, loc);
        return subJobs;
    }

    return [];
}

export default async function DynamicJobPage({ params }: Props) {
    const slug = (await params).slug;
    const jobs = await getJobs(slug);

    if (jobs.length === 0 && slug.length > 0) {
        // Optional: strict 404 if slug is invalid text, but here we just show empty or 404
        // For accurate SEO, we should 404 if the category doesn't strictly exist in DB types
        const isLoc = slug[0].startsWith('in-') || slug[0] === 'remote';
        const isCat = db.getCategoryType(slug[0]);

        if (!isLoc && !isCat) {
            notFound();
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2">
                {slug.length === 1 && slug[0].startsWith('in-') ?
                    `Jobs in ${slug[0].replace('in-', '').replace(/-/g, ' ')}` :
                    slug[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                }
            </h1>
            <p className="text-slate-400 mb-8">{jobs.length} open positions found</p>

            <div className="grid gap-4">
                {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}

                {jobs.length === 0 && (
                    <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-white/5">
                        No active job listings found for this criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
