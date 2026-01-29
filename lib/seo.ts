import { SEO_CONFIG } from './seo-config';
import { Job } from './mock-db';

export const siteConfig = {
  name: "FinalRoundAI",
  description: "The AI-native job board for the next generation of tech talent.",
  url: "http://localhost:3000",
};

export function generateJobTitle(job: Job): string {
  return SEO_CONFIG.meta.templates.job_view.title
    .replace('{JobTitle}', job.title)
    .replace('{Company}', job.company.name);
}

export function generateCategoryTitle(category: string, count: number): string {
  return SEO_CONFIG.meta.templates.main_category.title
    .replace('{Category}', category)
    .replace('{Count}', count.toString());
}

export function generateCategoryDescription(category: string, count: number): string {
  return SEO_CONFIG.meta.templates.main_category.description
    .replace('{Category}', category)
    .replace('{Count}', count.toString())
    .replace('{Related}', 'software, data, and manufacturing'); // Simplified related text
}

export function generateSubCategoryTitle(subcategory: string, count: number): string {
  return SEO_CONFIG.meta.templates.subcategory.title
    .replace('{Subcategory}', subcategory)
    .replace('{Count}', count.toString());
}

export function generateLocationTitle(location: string, count: number): string {
  // Assuming location string is "City, State"
  const [city, state] = location.split(', ');
  return SEO_CONFIG.meta.templates.location.title
    .replace('{City}', city || location)
    .replace('{State}', state || '')
    .replace('{Count}', count.toString());
}

export function generateCategoryLocationTitle(category: string, location: string, count: number): string {
  const [city, state] = location.split(', ');
  return SEO_CONFIG.meta.templates.category_location.title
    .replace('{Category}', category)
    .replace('{City}', city || location)
    .replace('{State}', state || '')
    .replace('{Count}', count.toString());
}

export function generateJobPostingSchema(job: any) {
  // Prisma uses createdAt, Mock uses postedAt. Handle both.
  const postedDate = job.postedAt || job.createdAt || new Date().toISOString();
  const dateObj = new Date(postedDate);
  const validThroughDate = new Date(dateObj.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Safety check for invalid dates
  const finalPostedDate = isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
  const finalValidThrough = isNaN(validThroughDate.getTime()) ? new Date(Date.now() + 7776000000).toISOString() : validThroughDate.toISOString();

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: finalPostedDate,
    validThrough: finalValidThrough,
    employmentType: job.type ? job.type.toUpperCase().replace('-', '_') : 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company?.name || 'Confidential',
      sameAs: job.company?.website,
      logo: job.company?.logoUrl
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location ? job.location.split(', ')[0] : 'Remote',
        addressRegion: job.location ? job.location.split(', ')[1] : '',
        addressCountry: 'US'
      }
    }
  };
}

export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.item}`
    }))
  };
}
