
1. Core URL Structure: 

Jobs Hub: /jobs

By Category: /jobs/[category-slug]
Example: /jobs/software-engineering
                /jobs/backend-developer

By Location: /jobs/in-[city-state]
Example: /jobs/in-san-francisco-ca
         /jobs/in-new-york-ny
         /jobs/in-austin-tx

Category + Location: /jobs/[category]/in-[city-state]
Example: /jobs/software-engineer/in-san-francisco-ca

Category + Remote Jobs
Example:  jobs/software-engineering/remote



Individual Job: /jobs/view/[job-title]-[company]-[id]
Example: /jobs/view/senior-software-engineer-stripe-j4k9x2
         /jobs/view/product-manager-airbnb-m3n8p1

Companies: /companies/[company-slug]
Example: /companies/stripe
         /companies/airbnb



Note - Use Query Parameters for Filters & Sorting (Not SEO URLs)
Query parameters should be used for:
Sorting: ?sort=salary-high, ?sort=date-posted, ?sort=relevance
Experience level: ?experience=senior, ?experience=entry-level
Job type: ?type=remote, ?type=full-time, ?type=contract
Etc etc.




2. Job Categories


Software Engineering 

Main Category URL: /jobs/software-engineering

Example Subcategories:
├── /jobs/software-developer
├── /jobs/frontend-developer
├── /jobs/backend-developer
├── /jobs/fullstack-developer
├── /jobs/mobile-developer
├── /jobs/devops-engineer
├── /jobs/qa-engineer
├── /jobs/test-automation-engineer
├── /jobs/sre-engineer 
└── /jobs/engineering-manager

Note - These are just example sub-categories, we can add more



Data Science & Analytics



Main Category URL: /jobs/data-science-analytics

Subcategories:
├── /jobs/data-scientist
├── /jobs/data-analyst
├── /jobs/data-engineer
├── /jobs/machine-learning-engineer
├── /jobs/ai-engineer
├── /jobs/business-analyst
├── /jobs/analytics-engineer
├── /jobs/business-intelligence-analyst
└── /jobs/data-engineering-manager


Note - These are just example sub-categories, we can add more









Sales and Business Development 

Main Category URL: /jobs/sales-and-business-development

Subcategory-
/jobs/sales
/jobs/business-development
/jobs/account-management
/jobs/customer-success
/jobs/customer-support
/jobs/revenue-operations
/jobs/growth-marketing

Note - These are just example sub-categories, we can add more






Product Management 

Main Category URL: /jobs/product-management

Subcategory-
/jobs/product-manager
/jobs/associate-product-manager
/jobs/senior-product-manager
/jobs/technical-product-manager


Note - These are just example sub-categories, we can add more





Marketing and Communication

Main Category URL: /jobs/marketing

Subcategory-
/jobs/marketing-manager
/jobs/digital-marketing-manager
/jobs/growth-marketer
/jobs/performance-marketing
/jobs/seo-specialist
/jobs/content-marketer

Note - These are just example sub-categories, we can add more




3. Page Creation Rules


Main Category Pages: 

/jobs/software-engineering
/jobs/data-science-analytics

Subcategory Pages: Create when you have 5+ jobs

/jobs/software-engineer (create)
/jobs/frontend-developer (create)
etc.

Location: Create when you have 5+ jobs

         /jobs/in-new-york-ny



Subcategory + Location: Create when you have 3+ jobs

/jobs/data-scientist/in-austin-tx (if you have 3+ data scientist jobs in Austin)

Main Category + Location: Create when you have 10+ jobs

/jobs/data-science-analytics/in-austin-tx (if you have 10+ data jobs in Austin total)

4. Meta Tags Examples

Main Category:
Title: Software Engineering Jobs | 1,234 Open Positions
Description: Browse 1,234 software engineering and QA jobs. Find software engineer, developer, QA, and DevOps positions at top companies.

Subcategory:
Title: Data Scientist Jobs | 456 Positions Available
Description: Find 456 data scientist jobs. Apply to top companies hiring data scientists with competitive salaries and benefits.

Location:
Title: Jobs in San Francisco, CA | 1,234 Tech Jobs Available
Description: Find 1,234 jobs in San Francisco, CA. Browse software engineer, data scientist, and tech jobs at top Bay Area companies. Apply now.


Subcategory + Location:
Title: Frontend Developer Jobs in Austin, TX | 89 Open Roles
Description: 89 frontend developer jobs in Austin, TX. Find React, Vue, and Angular developer positions at Austin tech companies.



Note: Cover Top Locations within USA & India



5. Core Web Vitals Requirements
Target LCP: < 2.5s
Target FID: < 100ms
Target CLS: < 0.1
Mobile-first indexing ready
Lazy loading for job cards
WebP images


6. Query Parameters Usage

Use Query Parameters for UX (Not for SEO):
Sorting: ?sort=salary-high or ?sort=date-posted
Multiple filters: ?experience=senior&type=remote&posted=week
Search within: ?q=python
Tracking: ?utm_source=email&ref=newsletter
Technical Handling:
All parameter URLs canonical back to base URL
Add noindex,follow to filtered pages
Or disallow in robots.txt


7. Add relevant Schema markup




8) Rendering Strategy
-Use Server-Side Rendering (SSR)
-Google needs fully rendered HTML for indexing
-Faster initial page load (better Core Web Vitals)
-JobPosting schema markup must be in initial HTML
-Meta tags need to be present on server response
-Better crawl efficiency for search bots


9) Basic SEO Checklist

H1 Tag - ONE per page with primary keyword
Title Tag - 50-60 characters with keyword
Meta Description - 150-160 characters with keyword and CTA
Clean URL Structure - Short, lowercase, keyword-included
Canonical Tag - Self-referencing on every page
Schema Markup - JobPosting, BreadcrumbList, CollectionPage
ADD OG TAGS



10) Active Jobs

-Jobs must be refreshed in the database at least every x hours (depending on source feed).

-Sitemap update

-Lastmod timestamp update

– When a job closes, remove it from the active jobs sitemap immediately.
