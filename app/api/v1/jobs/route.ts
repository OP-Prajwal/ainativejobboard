import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { JobDecompositionService } from "@/services/JobDecompositionService";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            title,
            description,
            type,
            location,
            salary,
            category,
            subcategory,
            companyName,
            skills,
            experienceLevel,
            manualTasks // Array of { description, type } or similar
        } = body;

        if (!title || !companyName) {
            return NextResponse.json({ error: "Title and Company Name are required" }, { status: 400 });
        }

        // Parse Salary Min/Max if useful?
        let salaryMin: number | null = null;
        let salaryMax: number | null = null;
        if (salary) {
            const numbers = salary.match(/\d+/g)?.map(Number);
            if (numbers && numbers.length > 0) {
                salaryMin = numbers[0] * (salary.toLowerCase().includes('k') && numbers[0] < 1000 ? 1000 : 1);
                if (numbers.length > 1) {
                    salaryMax = numbers[1] * (salary.toLowerCase().includes('k') && numbers[1] < 1000 ? 1000 : 1);
                } else {
                    salaryMax = salaryMin;
                }
            }
        }

        // 1. Handle Company Logic
        let companyId = "";
        // Clean company slug: remove special chars, ensure lowercase
        const companySlug = companyName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, '');   // Remove leading/trailing hyphens

        const existingCompany = await prisma.company.findUnique({
            where: { slug: companySlug }
        });

        if (existingCompany) {
            companyId = existingCompany.id;
        } else {
            const newCompany = await prisma.company.create({
                data: {
                    name: companyName,
                    slug: companySlug,
                    status: 'unverified'
                }
            });
            companyId = newCompany.id;
        }

        // 2. Generate Job Slug (title-company-shortId)
        // Format: [job-title]-[company]-[id]
        const jobShortId = Math.random().toString(36).substring(2, 8); // 6 chars
        const titleSlug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const jobSlug = `${titleSlug}-${companySlug}-${jobShortId}`;

        // 3. Create Job
        const job = await prisma.job.create({
            data: {
                title,
                description,
                type: type || "Full-time",
                location: location || "Remote",
                salary,
                salaryMin,
                salaryMax,
                experienceLevel: experienceLevel || "Entry-level",
                category,
                subcategory,
                companyId,
                slug: jobSlug,
                rawRequirements: {
                    skills: skills || []
                }
            }
        });

        console.log(`[JobCreation] Job ${job.id} created with slug ${jobSlug}`);

        // 4. Handle Tasks: Manual vs AI
        if (manualTasks && Array.isArray(manualTasks) && manualTasks.length > 0) {
            console.log(`[JobCreation] Using ${manualTasks.length} Provided Manual Tasks.`);

            const defaultOutcome = await prisma.jobOutcome.create({
                data: {
                    jobId: job.id,
                    description: "Manually Provided Tasks",
                    priorityLevel: 1
                }
            });

            for (const t of manualTasks) {
                await prisma.jobTask.create({
                    data: {
                        jobId: job.id,
                        outcomeId: defaultOutcome.id,
                        description: t.description,
                        taskType: t.type || "PRODUCTION_LIKE",
                        difficultyLevel: 1
                    }
                });
            }
        } else {
            console.log(`[JobCreation] No manual tasks. Triggering AI Decomposition...`);
            // Trigger AI Decomposition
            await JobDecompositionService.decompose(job.id);
        }

        return NextResponse.json({
            success: true,
            jobId: job.id,
            slug: jobSlug,
            message: "Job created successfully"
        });

    } catch (error: any) {
        console.error("Error creating job:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
