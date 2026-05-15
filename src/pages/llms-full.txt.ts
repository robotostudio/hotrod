import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../lib/content';
import { mdxToMarkdown } from '../lib/mdx-to-markdown';

const SITE_NAME = 'Hotrod';
const SITE_SUMMARY =
  'An open-source Astro starter for sites that are designed, written, and maintained by coding agents.';

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();

  const sections: string[] = [`# ${SITE_NAME}`, '', `> ${SITE_SUMMARY}`, ''];

  for (const post of posts) {
    const date = post.data.publishedAt.toISOString().slice(0, 10);
    sections.push(
      '---',
      '',
      `# ${post.data.title}`,
      '',
      `_Published ${date} by ${post.data.author.id}_`,
      '',
      post.data.description,
      '',
      mdxToMarkdown(post.body ?? ''),
    );
  }

  return new Response(sections.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
