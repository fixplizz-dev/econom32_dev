import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://econom32.ru';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Disallow admin areas
Disallow: /admin/
Disallow: /api/

# Allow important pages
Allow: /
Allow: /about
Allow: /news
Allow: /structure
Allow: /appeals
Allow: /contacts
Allow: /activity/

# Sitemap location
Sitemap: ${BASE_URL}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}