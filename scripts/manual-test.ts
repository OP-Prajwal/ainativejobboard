import 'dotenv/config';
import prisma from '../lib/prisma';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function main() {
    console.log("Posting 2 Test Jobs...");

    // Job 1: Manual Entry Simulation
    try {
        const job1 = {
            title: "Manual Test Engineer",
            companyName: "ManualComp",
            description: "This is a manually posted job to test SEO indexing.",
            type: "Full-time",
            location: "New York, NY",
            salary: "$100k - $120k",
            category: "Software Engineering",
            subcategory: "QA Engineer",
            skills: ["Manual Testing", "SEO"],
            experienceLevel: "Mid-Level"
        };

        console.log("Posting Job 1...");
        const res1 = await axios.post(`${BASE_URL}/api/v1/jobs`, job1);
        console.log("Job 1 Created:", res1.data.slug);
    } catch (e: any) {
        console.error("Error creating Job 1:", e.response?.data || e.message);
    }

    // Job 2: Another Manual Entry
    try {
        const job2 = {
            title: "Manual Data Analyst",
            companyName: "ManualComp",
            description: "Another manually posted job for verification.",
            type: "Contract",
            location: "Remote",
            salary: "$80k - $90k",
            category: "Data Science & Analytics",
            subcategory: "Data Analyst",
            skills: ["Excel", "SQL"],
            experienceLevel: "Entry-Level"
        };

        console.log("Posting Job 2...");
        const res2 = await axios.post(`${BASE_URL}/api/v1/jobs`, job2);
        console.log("Job 2 Created:", res2.data.slug);
    } catch (e: any) {
        console.error("Error creating Job 2:", e.response?.data || e.message);
    }

    console.log("\nDone! Now check the browser.");
}

main();
