import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { generateJobTitle, generateJobPostingSchema } from '@/lib/seo';
import { Metadata } from 'next';
import Link from 'next/link';
import { ApplyForm } from './ApplyForm'; // New Client Component

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const slug = (await params).slug;
    const job = await prisma.job.findUnique({
        where: { slug },
        include: { company: true }
    });

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
    const job = await prisma.job.findUnique({
        where: { slug },
        include: { company: true }
    });

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

            <Link href={`/jobs/${job.category}`} className="text-sm text-blue-400 hover:text-blue-300 mb-6 inline-block">
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
                                🕒 Posted {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div>
                        {/* Apply Button moved to Client Component */}
                    </div>
                </div>
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-600/20 blur-[100px] rounded-full pointer-events-none" />
            </div>

            <div className="grid md:grid-cols-[1fr_300px] gap-8">
                {/* Main Content */}
                <div>
                    <div className="prose prose-invert max-w-none text-slate-300 mb-12">
                        {/* Assuming description is markdown or text */}
                        <p>{job.description}</p>
                    </div>

                    {/* Apply Form Section */}
                    <div className="my-10 p-6 glass-panel rounded-xl">
                        <h3 className="text-xl font-bold text-white mb-4">Apply for this Position</h3>
                        <ApplyForm jobId={job.id} jobTitle={job.title} />
                    </div>

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
                                <span className="text-slate-400">Type</span>
                                <span className="text-right text-slate-200 font-medium">{job.type}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-400">Experience</span>
                                <span className="text-right text-slate-200 font-medium">{job.experienceLevel || 'Not Specified'}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-400">Salary</span>
                                <span className="text-right text-slate-200 font-medium">
                                    {job.salary || (job.salaryMin && job.salaryMax ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}` : 'Competitive')}
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Tech Stack from rawRequirements */}
                    {(job.rawRequirements as any)?.stack && (
                        <div className="glass-panel p-6 rounded-xl">
                            <h3 className="font-bold text-white mb-4">Requirements</h3>
                            <div className="flex flex-wrap gap-2">
                                {(job.rawRequirements as any).stack.map((tech: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
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
    );
}

