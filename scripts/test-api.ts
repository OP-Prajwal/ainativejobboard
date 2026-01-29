
import 'dotenv/config';
import prisma from '../lib/prisma';
import { JobDecompositionService } from "../services/JobDecompositionService";

async function main() {
    console.log("Testing Job Creation Logic...");
    const companyName = "Stripe";
    const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    console.log("Slug:", companySlug);

    // 1. Company
    let companyId = "";
    const existingCompany = await prisma.company.findUnique({
        where: { slug: companySlug }
    });

    if (existingCompany) {
        console.log("Company found:", existingCompany.id);
        companyId = existingCompany.id;
    } else {
        console.log("Creating company...");
        const newCompany = await prisma.company.create({
            data: {
                name: companyName,
                slug: companySlug,
                status: 'unverified'
            }
        });
        console.log("Company created:", newCompany.id);
        companyId = newCompany.id;
    }

    // 2. Job 
    const jobShortId = Math.random().toString(36).substring(2, 8);
    const title = "Senior Backend Engineer";
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const jobSlug = `${titleSlug}-${companySlug}-${jobShortId}`;

    console.log("Job Slug:", jobSlug);

    const job = await prisma.job.create({
        data: {
            title,
            description: "Test Description",
            type: "Full-time",
            location: "Remote",
            companyId,
            slug: jobSlug,
            rawRequirements: {
                skills: ["Java"]
            }
        }
    });
    console.log("Job Created:", job.id);
}

main().catch(console.error);
