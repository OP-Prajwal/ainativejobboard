import { Prisma } from '@prisma/client';

export type JobSortOption = 'relevance' | 'date-posted' | 'salary-high' | 'oldest';

export function parseJobFilters(searchParams: { [key: string]: string | string[] | undefined }) {
    const { sort, type, experience, salary } = searchParams;

    // Default sort
    let orderBy: Prisma.JobOrderByWithRelationInput = { createdAt: 'desc' };

    if (sort === 'oldest') {
        orderBy = { createdAt: 'asc' };
    } else if (sort === 'salary-high') {
        // Sort by salaryMax desc, nulls last usually, but Prisma simple sort:
        orderBy = { salaryMax: 'desc' };
    } else if (sort === 'relevance' || sort === 'date-posted') {
        // Relevance usually implies search relevance. If no search term, default to date.
        orderBy = { createdAt: 'desc' };
    }

    const where: Prisma.JobWhereInput = {};

    // Filter by Type (Full-time, Contract, etc)
    if (typeof type === 'string' && type) {
        if (type.toLowerCase() === 'remote') {
            // Smart filter: "Remote" often lives in location, not type
            where.location = {
                contains: 'Remote',
                mode: 'insensitive'
            };
        } else {
            where.type = {
                equals: type,
                mode: 'insensitive'
            };
        }
    }

    // Filter by Experience Level
    if (typeof experience === 'string' && experience) {
        where.OR = [
            {
                experienceLevel: {
                    contains: experience.replace(/-/g, ' '),
                    mode: 'insensitive'
                }
            },
            {
                title: {
                    contains: experience.replace(/-/g, ' '),
                    mode: 'insensitive'
                }
            }
        ];
    }

    // Filter by Salary (Min) logic
    // If ?salary=100000, show jobs with max salary >= 100000
    if (typeof salary === 'string') {
        const minSalary = parseInt(salary);
        if (!isNaN(minSalary)) {
            where.salaryMax = {
                gte: minSalary
            };
        }
    }

    // Filter by Min Salary from explicit ranges if passed (advanced)

    return { where, orderBy };
}
