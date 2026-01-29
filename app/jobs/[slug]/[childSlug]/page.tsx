import prisma from '@/lib/prisma';
import { JobCard } from '@/components/JobCard';
import { notFound } from 'next/navigation';
import { parseJobFilters } from '@/lib/job-filters';
import { SEO_THRESHOLDS, isMainCategory, isSubcategory } from '@/lib/seo-config';

type Props = {
    params: Promise<{ slug: string; childSlug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getJobCount(where: any) {
    return await prisma.job.count({ where });
}

export async function generateMetadata({ params }: Props) {
    const { slug, childSlug } = await params;

    // Check Thresholds
    const categoryQuery = slug.replace(/-/g, ' ');
    let locationQuery = "";
    if (childSlug.startsWith('in-')) {
        locationQuery = childSlug.replace('in-', '').replace(/-/g, ' ');
    } else if (childSlug === 'remote') {
        locationQuery = "Remote";
    }

    let where: any = {};
    if (locationQuery) {
        where.location = { contains: locationQuery, mode: 'insensitive' };
    }

    const isSub = isSubcategory(slug);

    if (isSub) {
        where.OR = [
            { category: { contains: categoryQuery, mode: 'insensitive' } },
            { subcategory: { contains: categoryQuery, mode: 'insensitive' } },
            { category: { equals: slug, mode: 'insensitive' } }
        ];
    } else {
        where.OR = [
            { category: { contains: categoryQuery, mode: 'insensitive' } },
            { category: { equals: slug, mode: 'insensitive' } }
        ];
    }

    const count = await getJobCount(where);
    let shouldIndex = true;

    if (isMainCategory(slug) && locationQuery) {
        if (count < SEO_THRESHOLDS.MAIN_CATEGORY_LOCATION) shouldIndex = false;
    } else if (isSub && locationQuery) {
        if (count < SEO_THRESHOLDS.SUBCATEGORY_LOCATION) shouldIndex = false;
    } else {
        if (count < 3) shouldIndex = false;
    }

    // Template Logic
    // Subcategory + Location: Frontend Developer Jobs in Austin, TX | 89 Open Roles
    // Desc: 89 frontend developer jobs in Austin, TX. Find React, Vue, and Angular developer positions at Austin tech companies.

    const catName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const locName = locationQuery === 'Remote' ? 'Remote' : locationQuery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const title = `${catName} Jobs ${locationQuery === 'Remote' ? '' : 'in'} ${locName} | ${count.toLocaleString()} Open Roles`;
    const description = `${count.toLocaleString()} ${catName} jobs ${locationQuery === 'Remote' ? 'Remote' : 'in ' + locName}. Find positions at top companies.`;

    return {
        title,
        description,
        robots: {
            index: shouldIndex,
            follow: shouldIndex
        }
    };
}

export default async function SubCategoryOrLocationPage({ params, searchParams }: Props) {
    const { slug, childSlug } = await params;
    const queryParams = await searchParams;
    const { where: queryWhere, orderBy } = parseJobFilters(queryParams);

    // Parent 'slug' is typically Category
    // Child 'childSlug' is typically 'in-location' or 'remote'

    // 1. Parse Category from 'slug'
    const categoryQuery = slug.replace(/-/g, ' ');

    // 2. Parse Location from 'childSlug'
    let locationQuery = "";
    if (childSlug.startsWith('in-')) {
        locationQuery = childSlug.replace('in-', '').replace(/-/g, ' ');
    } else if (childSlug === 'remote') {
        locationQuery = "Remote";
    } else {
        // Invalid URL pattern for this structure
        locationQuery = "";
    }

    const where: any = {
        ...queryWhere, // Include filters
    };

    if (locationQuery) {
        where.location = {
            contains: locationQuery,
            mode: 'insensitive'
        };
    }

    // Category Logic matching Metadata logic
    const isSub = isSubcategory(slug);
    if (isSub) {
        where.OR = [
            { category: { contains: categoryQuery, mode: 'insensitive' } },
            { subcategory: { contains: categoryQuery, mode: 'insensitive' } },
            { category: { equals: slug, mode: 'insensitive' } } // Matches raw slug
        ];
    } else {
        where.OR = [
            { category: { contains: categoryQuery, mode: 'insensitive' } },
            { category: { equals: slug, mode: 'insensitive' } } // Matches raw slug
        ];
    }

    const title = `${categoryQuery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Jobs`;
    const subtitle = locationQuery ? (locationQuery === "Remote" ? "Remote" : `in ${locationQuery}`) : "";

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
                item: 'https://finalroundai.com'
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
                name: isSubcategory(slug) || isMainCategory(slug) ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : slug,
                item: `https://finalroundai.com/jobs/${slug}`
            },
            {
                '@type': 'ListItem',
                position: 4,
                name: title.split('|')[0].trim(),
                item: `https://finalroundai.com/jobs/${slug}/${childSlug}`
            }
        ]
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
            <h1 className="text-3xl font-bold mb-2">
                {title} <span className="text-violet-400">{subtitle}</span>
            </h1>
            <p className="text-slate-400 mb-8">{jobs.length} open positions</p>

            <div className="grid gap-4">
                {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}
            </div>

            {jobs.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <p>No jobs found for this specific combination.</p>
                </div>
            )}
        </div>
    );
}
