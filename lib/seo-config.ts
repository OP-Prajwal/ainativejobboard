// SEO ARCHITECTURE (LOCKED)
// This file serves as the single source of truth for SEO rules.
// No logic implementation, only configuration constants.

export const SEO_CONFIG = {
    // 1. Core URL Structure & Routing
    routes: {
        allowed_patterns: [
            '/jobs',                                      // Jobs Hub
            '/jobs/[category]',                           // Main Category
            '/jobs/[category]/[subcategory]',             // Subcategory (handled by dynamic slug)
            '/jobs/in-[location]',                        // Location
            '/jobs/[category]/in-[location]',             // Category + Location
            '/jobs/[category]/remote',                    // Category + Remote
            '/jobs/view/[job-slug]',                      // Individual Job View
            '/companies/[company-slug]',                  // Company Profile
        ],
        forbidden: [
            'Query parameter based indexing (e.g. ?sort=)',
            'Arbitrary filter combinations',
            'Client-side schema injection'
        ],
        query_params_ux_only: [
            'sort',       // e.g. ?sort=salary-high
            'experience', // e.g. ?experience=senior
            'type',       // e.g. ?type=contract
            'q',          // e.g. ?q=python
            'utm_*'       // Tracking
        ]
    },

    // 2. Page Creation Rules (Indexability Thresholds)
    thresholds: {
        subcategory_page: 5,        // Create/Index only if 5+ active jobs
        location_page: 5,           // Create/Index only if 5+ active jobs
        subcategory_location: 3,    // Create/Index only if 3+ active jobs
        main_category_location: 10, // Create/Index only if 10+ active jobs
    },

    // 3. Meta Tag Rules & Templates
    meta: {
        rules: {
            h1_per_page: 1,
            title_length: { min: 50, max: 60 },
            description_length: { min: 150, max: 160 },
            canonical: 'self-referencing-ignoring-query-params',
        },
        templates: {
            main_category: {
                title: "{Category} Jobs | {Count} Open Positions",
                description: "Browse {Count} {Category} and related jobs. Find {Related} positions at top companies."
            },
            subcategory: {
                title: "{Subcategory} Jobs | {Count} Positions Available",
                description: "Find {Count} {Subcategory} jobs. Apply to top companies hiring {Subcategory}s with competitive salaries."
            },
            location: {
                title: "Jobs in {City}, {State} | {Count} Tech Jobs Available",
                description: "Find {Count} jobs in {City}, {State}. Browse software engineer, data scientist, and tech jobs at top {City} companies."
            },
            category_location: {
                title: "{Category} Jobs in {City}, {State} | {Count} Open Roles",
                description: "{Count} {Category} jobs in {City}, {State}. Find React, Vue, and Angular positions at {City} tech companies."
            },
            job_view: {
                title: "{JobTitle} at {Company} - Apply Now",
                description: "{JobTitle} at {Company} in {Location}. {Snippet}..."
            }
        }
    },

    // 4. Core Web Vitals Targets
    performance: {
        lcp_seconds: 2.5,
        fid_ms: 100,
        cls: 0.1,
        requirements: [
            'mobile-first-indexing',
            'lazy-loading-job-cards',
            'webp-images-only'
        ]
    },

    // 5. Schema Markup (SSR Only)
    schema: {
        required_ssr: [
            'JobPosting',       // For Job Pages
            'CollectionPage',   // For Listings
            'BreadcrumbList',   // For Navigation
            'Organization'      // For Company Pages
        ]
    },

    // 6. Sitemap Rules
    sitemap: {
        update_frequency: 'dynamic-db-driven',
        remove_on_close: 'immediate',
        include_query_params: false
    }
} as const;
