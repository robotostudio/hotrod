import type { APIRoute, GetStaticPaths } from 'astro';
import { getPublishedPosts } from '../../lib/content';
import { mdxToMarkdown } from '../../lib/mdx-to-markdown';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
};

export const GET: APIRoute = ({ props }) => {
  const { post } = props as { post: Awaited<ReturnType<typeof getPublishedPosts>>[number] };
  const { title, description, publishedAt, updatedAt, author, tags } = post.data;

  const header: string[] = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `publishedAt: ${publishedAt.toISOString().slice(0, 10)}`,
  ];
  if (updatedAt) header.push(`updatedAt: ${updatedAt.toISOString().slice(0, 10)}`);
  header.push(`author: ${JSON.stringify(author.id)}`);
  if (tags.length > 0) header.push(`tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]`);
  header.push('---', '');

  const body = mdxToMarkdown(post.body ?? '');

  return new Response(`${header.join('\n')}\n${body}`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
