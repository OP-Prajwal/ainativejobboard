import { db } from '@/lib/mock-db';
import { notFound } from 'next/navigation';
import { generateJobTitle, generateJobPostingSchema } from '@/lib/seo';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const slug = (await params).slug;
    const job = db.getJobBySlug(slug);

    if (!job) return {};

    return {
        title: generateJobTitle(job),
        description: `Apply for ${job.title} at ${job.company.name}.`,
        openGraph: {
            title: job.title,
            description: `Join ${job.company.name} as a ${job.title}.`,
            type: 'website',
        }
    };
}

export default async function JobViewPage({ params }: Props) {
    const slug = (await params).slug;
    const job = db.getJobBySlug(slug);

    if (!job) {
        notFound();
    }

    const jsonLd = generateJobPostingSchema(job);

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <Link href={`/jobs/${job.categorySlug}`} className="text-sm text-blue-400 hover:text-blue-300 mb-6 inline-block">
                ← Back to {job.category}
            </Link>

            {/* Job Header */}
            <div className="glass-panel p-8 rounded-2xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-400 border border-white/10">
                        {job.company.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
                        <div className="flex flex-wrap gap-4 text-slate-400 mb-4">
                            <span className="flex items-center gap-1">
                                🏢 {job.company.name}
                            </span>
                            <span className="flex items-center gap-1">
                                📍 {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                                🕒 Posted {new Date(job.postedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div>
                        <button className="px-6 py-3 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-200 transition-colors shadow-lg shadow-white/10">
                            Apply Now
                        </button>
                    </div>
                </div>
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-600/20 blur-[100px] rounded-full pointer-events-none" />
            </div>

            <div className="grid md:grid-cols-[1fr_300px] gap-8">
                {/* Main Content */}
                <div>
                    <div className="prose prose-invert max-w-none text-slate-300 mb-12">
                        <div dangerouslySetInnerHTML={{ __html: job.description }} />
                    </div>

                    {/* === PLUG-IN CONTAINER === */}
                    {/* 
                       This is the integration point for the FinalRoundAI plugin.
                       It is placed strategically after the description but before the application section.
                    */}
                    <div
                        id="plugin-container"
                        className="my-10 min-h-[100px]"
                        data-job-id={job.id}
                        data-job-title={job.title}
                        data-company={job.company.name}
                    ></div>
                    {/* === END PLUG-IN CONTAINER === */}

                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="font-bold text-white mb-4">Job Details</h3>
                        <ul className="space-y-4 text-sm text-slate-400">
                            <li className="flex justify-between">
                                <span>Category</span>
                                <span className="text-right text-slate-200">{job.category}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Subcategory</span>
                                <span className="text-right text-slate-200">{job.subcategory}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Type</span>
                                <span className="text-right text-slate-200">{job.type}</span>
                            </li>
                        </ul>
                    </div>
                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="font-bold text-white mb-4">About {job.company.name}</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Leading the industry in innovation...
                        </p>
                        <Link href={`/companies/${job.companyId}`} className="text-sm text-blue-400 hover:text-blue-300">
                            View Company Profile
                        </Link>
                    </div>
                </div>
            </div>
        </div>
            </div >

        {/* === SDK INTEGRATION SCRIPT (MOCKING HOST INSERTION) === */ }
        < script src = "/sdk.js" defer ></script >
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        window.addEventListener('load', function() {
                            if (window.FinalRoundPlugin) {
                                window.FinalRoundPlugin.init({
                                    apiUrl: 'http://localhost:3000/api', // Mock API for now
                                    environment: 'development'
                                });
                            }
                        });
                    `
                }}
            />
        </div >
    );
}

