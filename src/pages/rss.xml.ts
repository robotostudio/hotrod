import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../lib/content';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  if (!context.site) {
    throw new Error('`site` must be set in astro.config.mjs for the RSS feed.');
  }
  return rss({
    title: 'Hotrod blog',
    description:
      "Notes from the Roboto Studio team on agent-first websites, Astro patterns, Zod-typed page builders, and what we learn shipping Hotrod.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
    customData: '<language>en-gb</language>',
  });
}
