import prisma from '@/lib/prisma';
import { JobCard } from '@/components/JobCard';
import { notFound } from 'next/navigation';
import { parseJobFilters } from '@/lib/job-filters';
import { SEO_THRESHOLDS, isMainCategory, isSubcategory } from '@/lib/seo-config';

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getJobCount(where: any) {
    return await prisma.job.count({ where });
}

export async function generateMetadata({ params, searchParams }: Props) {
    const slug = (await params).slug;
    const isLocation = slug.startsWith('in-') || slug === 'remote';

    // We need to count jobs to decide on 'noindex' and for Title counts
    let where: any = {};
    if (isLocation) {
        if (slug === 'remote') {
            where.location = { contains: 'Remote', mode: 'insensitive' };
        } else {
            const locationQuery = slug.replace('in-', '').replace(/-/g, ' ');
            where.location = { contains: locationQuery, mode: 'insensitive' };
        }
    } else {
        const categoryQuery = slug.replace(/-/g, ' ');
        where.category = { contains: categoryQuery, mode: 'insensitive' };
    }

    const count = await getJobCount(where);
    let shouldIndex = true;

    if (isLocation) {
        if (count < SEO_THRESHOLDS.LOCATION) shouldIndex = false;
    } else if (isSubcategory(slug)) {
        if (count < SEO_THRESHOLDS.SUBCATEGORY) shouldIndex = false;
    } else if (isMainCategory(slug)) {
        if (count === 0) shouldIndex = false;
    } else {
        if (count < SEO_THRESHOLDS.SUBCATEGORY) shouldIndex = false;
    }

    // ... (previous logic)

    // Title & Description Logic
    let title = "";
    let description = "";
    const cleanSlug = slug.replace('in-', '').replace(/-/g, ' ');
    const displaySlug = cleanSlug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    if (isLocation) {
        const locName = slug === 'remote' ? 'Remote' : displaySlug;
        title = `Jobs in ${locName} | ${count.toLocaleString()} Tech Jobs Available`;
        description = `Find ${count.toLocaleString()} jobs in ${locName}. Browse software engineer, data scientist, and tech jobs at top companies. Apply now.`;
    } else if (isSubcategory(slug)) {
        title = `${displaySlug} Jobs | ${count.toLocaleString()} Positions Available`;
        description = `Find ${count.toLocaleString()} ${displaySlug} jobs. Apply to top companies hiring ${displaySlug}s with competitive salaries and benefits.`;
    } else {
        title = `${displaySlug} Jobs | ${count.toLocaleString()} Open Positions`;
        description = `Browse ${count.toLocaleString()} ${displaySlug} jobs. Find positions at top companies.`;
    }

    // Canonical & Query Param Logic
    const query = await searchParams;
    const hasFilters = Object.keys(query).length > 0;

    // If filters exist, NOINDEX to prevent duplicate content
    if (hasFilters) {
        shouldIndex = false;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const canonicalUrl = `${baseUrl}/jobs/${slug}`;

    return {
        title,
        description,
        robots: {
            index: shouldIndex,
            follow: shouldIndex
        },
        alternates: {
            canonical: canonicalUrl
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: 'website',
            siteName: 'FinalRoundAI',
            images: [
                {
                    url: `${baseUrl}/api/og?title=${encodeURIComponent(title)}`, // Placeholder for dynamic OG image
                    width: 1200,
                    height: 630,
                    alt: title
                }
            ]
        }
    };
}

export default async function CategoryOrLocationPage({ params, searchParams }: Props) {
    const slug = (await params).slug;
    const queryParams = await searchParams;

    // Get shared filters (query params)
    const { where: queryWhere, orderBy } = parseJobFilters(queryParams);

    let where: any = { ...queryWhere }; // Start with query filters
    let title = "";

    if (slug.startsWith('in-')) {
        // Location Page
        const locationQuery = slug.replace('in-', '').replace(/-/g, ' ');
        where.location = {
            contains: locationQuery,
            mode: 'insensitive'
        };
        title = `Jobs in ${locationQuery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    } else if (slug === 'remote') {
        where.location = {
            contains: 'Remote',
            mode: 'insensitive'
        };
        title = "Remote Jobs";
    } else {
        // Category Page
        const categoryQuery = slug.replace(/-/g, ' ');
        // Search for BOTH "software engineering" AND "software-engineering"
        where.OR = [
            { category: { contains: categoryQuery, mode: 'insensitive' } },
            { category: { equals: slug, mode: 'insensitive' } } // Matches raw slug
        ];
        title = `${categoryQuery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Jobs`;
    }

    const jobs = await prisma.job.findMany({
        where: {
            ...where,
            status: 'active'
        },
        include: {
            company: true
        },
        orderBy
    });

    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://finalroundai.com' // Replace with env var if possible
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Jobs',
                item: 'https://finalroundai.com/jobs'
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: title.split('|')[0].trim(), // "Software Engineering Jobs" or "Jobs in Austin"
                item: `https://finalroundai.com/jobs/${slug}`
            }
        ]
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-slate-400 mb-8">{jobs.length} open positions</p>

            <div className="grid gap-4">
                {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}
            </div>

            {jobs.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <p>No jobs found for this category/location.</p>
                </div>
            )}
        </div>
    );
}
