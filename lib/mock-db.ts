import { v4 as uuidv4 } from 'uuid';

export interface Company {
    id: string;
    name: string;
    slug: string;
    logoUrl: string;
    website: string;
}

export interface Job {
    id: string;
    title: string;
    slug: string;
    companyId: string;
    company: Company;
    category: string; // "Software Engineering"
    categorySlug: string; // "software-engineering"
    subcategory: string; // "Frontend Developer"
    subcategorySlug: string; // "frontend-developer"
    location: string;
    locationSlug: string;
    type: string;
    description: string;
    postedAt: string;
}

// EXACT DATA STRUCTURE FROM USER REQUEST
export const CATEGORY_HIERARCHY = {
    "Software Engineering": {
        slug: "software-engineering",
        subcategories: [
            { name: "Software Developer", slug: "software-developer" },
            { name: "Frontend Developer", slug: "frontend-developer" },
            { name: "Backend Developer", slug: "backend-developer" },
            { name: "Fullstack Developer", slug: "fullstack-developer" },
            { name: "Mobile Developer", slug: "mobile-developer" },
            { name: "DevOps Engineer", slug: "devops-engineer" },
            { name: "QA Engineer", slug: "qa-engineer" },
            { name: "Test Automation Engineer", slug: "test-automation-engineer" },
            { name: "SRE Engineer", slug: "sre-engineer" },
            { name: "Engineering Manager", slug: "engineering-manager" }
        ]
    },
    "Data Science & Analytics": {
        slug: "data-science-analytics",
        subcategories: [
            { name: "Data Scientist", slug: "data-scientist" },
            { name: "Data Analyst", slug: "data-analyst" },
            { name: "Data Engineer", slug: "data-engineer" },
            { name: "Machine Learning Engineer", slug: "machine-learning-engineer" },
            { name: "AI Engineer", slug: "ai-engineer" },
            { name: "Business Analyst", slug: "business-analyst" },
            { name: "Analytics Engineer", slug: "analytics-engineer" },
            { name: "Business Intelligence Analyst", slug: "business-intelligence-analyst" },
            { name: "Data Engineering Manager", slug: "data-engineering-manager" }
        ]
    },
    "Sales and Business Development": {
        slug: "sales-and-business-development",
        subcategories: [
            { name: "Sales", slug: "sales" },
            { name: "Business Development", slug: "business-development" },
            { name: "Account Management", slug: "account-management" },
            { name: "Customer Success", slug: "customer-success" },
            { name: "Customer Support", slug: "customer-support" },
            { name: "Revenue Operations", slug: "revenue-operations" },
            { name: "Growth Marketing", slug: "growth-marketing" }
        ]
    },
    "Product Management": {
        slug: "product-management",
        subcategories: [
            { name: "Product Manager", slug: "product-manager" },
            { name: "Associate Product Manager", slug: "associate-product-manager" },
            { name: "Senior Product Manager", slug: "senior-product-manager" },
            { name: "Technical Product Manager", slug: "technical-product-manager" }
        ]
    },
    "Marketing and Communication": {
        slug: "marketing",
        subcategories: [
            { name: "Marketing Manager", slug: "marketing-manager" },
            { name: "Digital Marketing Manager", slug: "digital-marketing-manager" },
            { name: "Growth Marketer", slug: "growth-marketer" },
            { name: "Performance Marketing", slug: "performance-marketing" },
            { name: "SEO Specialist", slug: "seo-specialist" },
            { name: "Content Marketer", slug: "content-marketer" }
        ]
    }
};

const LOCATIONS = [
    { name: "San Francisco, CA", slug: "in-san-francisco-ca" },
    { name: "New York, NY", slug: "in-new-york-ny" },
    { name: "Austin, TX", slug: "in-austin-tx" },
    { name: "Seattle, WA", slug: "in-seattle-wa" },
    { name: "Remote", slug: "remote" }
];

const COMPANIES = [
    { name: "TechNova", slug: "technova" },
    { name: "DataFlow", slug: "dataflow" },
    { name: "CloudScale", slug: "cloudscale" },
    { name: "AIPioneers", slug: "aipioneers" },
    { name: "CyberGuard", slug: "cyberguard" },
    { name: "Nexus Systems", slug: "nexus-systems" },
    { name: "Vertex Logic", slug: "vertex-logic" }
];

let _jobs: Job[] = [];

function generateJobs() {
    if (_jobs.length > 0) return _jobs;

    let count = 0;
    // Generate at least 60 jobs distributed across categories
    for (const [catName, catData] of Object.entries(CATEGORY_HIERARCHY)) {
        for (const sub of catData.subcategories) {
            // Generate 1-3 jobs per subcategory
            const numJobs = Math.floor(Math.random() * 3) + 1;

            for (let i = 0; i < numJobs; i++) {
                const companyObj = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
                const locationObj = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
                const title = `${sub.name} at ${companyObj.name}`; // e.g. "Frontend Developer at TechNova"

                const jobSlug = `${sub.slug}-${companyObj.slug}-${Math.floor(Math.random() * 10000)}`;

                _jobs.push({
                    id: uuidv4(),
                    title: sub.name, // Simplified title for listing
                    slug: jobSlug,
                    companyId: companyObj.slug,
                    company: {
                        id: uuidv4(),
                        ...companyObj,
                        logoUrl: `/logos/${companyObj.slug}.png`,
                        website: `https://${companyObj.slug}.com`
                    },
                    category: catName,
                    categorySlug: catData.slug,
                    subcategory: sub.name,
                    subcategorySlug: sub.slug,
                    location: locationObj.name,
                    locationSlug: locationObj.slug,
                    type: "Full-time",
                    description: `
                  <h2>About the Role</h2>
                  <p>We are looking for a talented <strong>${sub.name}</strong> to join our ${catName} team.</p>
                  <h2>Key Responsibilities</h2>
                  <ul>
                    <li>Build scalable solutions for...</li>
                    <li>Collaborate with cross-functional teams...</li>
                  </ul>
                  <h2>Requirements</h2>
                  <ul>
                    <li>Experience in ${catName}</li>
                    <li>Strong problem-solving skills</li>
                  </ul>
                `,
                    postedAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
                });
                count++;
            }
        }
    }
    return _jobs;
}

export const db = {
    getAllJobs: () => generateJobs(),

    getJobBySlug: (slug: string) => generateJobs().find(j => j.slug === slug),

    getJobsByCategory: (catSlug: string) => generateJobs().filter(j => j.categorySlug === catSlug),

    getJobsBySubcategory: (subSlug: string) => generateJobs().filter(j => j.subcategorySlug === subSlug),

    getJobsByLocation: (locSlug: string) => generateJobs().filter(j => j.locationSlug === locSlug),

    getJobsByCategoryAndLocation: (catSlug: string, locSlug: string) => generateJobs().filter(j =>
        j.categorySlug === catSlug && j.locationSlug === locSlug
    ),

    getJobsBySubcategoryAndLocation: (subSlug: string, locSlug: string) => generateJobs().filter(j =>
        j.subcategorySlug === subSlug && j.locationSlug === locSlug
    ),

    getAllCategories: () => Object.values(CATEGORY_HIERARCHY),

    getAllLocations: () => LOCATIONS,

    // Helper to find if a slug is a main category or subcategory
    getCategoryType: (slug: string): 'main' | 'sub' | null => {
        for (const cat of Object.values(CATEGORY_HIERARCHY)) {
            if (cat.slug === slug) return 'main';
            if (cat.subcategories.some(s => s.slug === slug)) return 'sub';
        }
        return null;
    }
};
