import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Generate RSS feed for news
router.get('/news', async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      where: { published: true },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        tags: true,
        categories: true
      },
      orderBy: { publishedAt: 'desc' },
      take: 50 // Limit to last 50 news items
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const currentDate = new Date().toUTCString();

    // Generate RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Новости - Департамент экономического развития Брянской области</title>
    <link>${baseUrl}/news</link>
    <description>Актуальные новости и события Департамента экономического развития Брянской области</description>
    <language>ru-RU</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss/news" rel="self" type="application/rss+xml"/>
    <generator>Департамент экономического развития Брянской области</generator>
    <webMaster>info@econom32.ru (Департамент экономического развития)</webMaster>
    <managingEditor>info@econom32.ru (Департамент экономического развития)</managingEditor>
    <copyright>© 2025 Департамент экономического развития Брянской области</copyright>
    <category>Государственные новости</category>
    <ttl>60</ttl>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>Департамент экономического развития Брянской области</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
${news.map(item => {
  const pubDate = new Date(item.publishedAt || item.createdAt).toUTCString();
  const categories = item.categories?.map(cat => `<category>${escapeXml(cat.nameRu)}</category>`).join('\n      ') || '';
  const tags = item.tags?.map(tag => `<category>${escapeXml(tag.name)}</category>`).join('\n      ') || '';
  
  return `    <item>
      <title>${escapeXml(item.titleRu)}</title>
      <link>${baseUrl}/news/${item.id}</link>
      <description>${escapeXml(item.excerptRu || stripHtml(item.contentRu).substring(0, 300) + '...')}</description>
      <author>info@econom32.ru (${escapeXml(item.author.name)})</author>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${baseUrl}/news/${item.id}</guid>
      ${categories}
      ${tags}
      ${item.featuredImage ? `<enclosure url="${item.featuredImage}" type="image/jpeg"/>` : ''}
    </item>`;
}).join('\n')}
  </channel>
</rss>`;

    res.set({
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });

    res.send(rssXml);
  } catch (error) {
    console.error('RSS feed error:', error);
    res.status(500).json({ error: 'Ошибка генерации RSS ленты' });
  }
});

// Helper function to escape XML characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

module.exports = router;