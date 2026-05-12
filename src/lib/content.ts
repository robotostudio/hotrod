import { getCollection } from 'astro:content';

const RESERVED_PAGE_SEGMENTS = ['blog', 'authors'] as const;

function isPublished(data: { draft?: boolean }): boolean {
  if (import.meta.env.DEV) return true;
  return data.draft !== true;
}

export async function getPublishedPages() {
  const entries = await getCollection('pages', (entry) => isPublished(entry.data));
  for (const entry of entries) {
    const firstSegment = entry.id.split('/')[0];
    if ((RESERVED_PAGE_SEGMENTS as readonly string[]).includes(firstSegment)) {
      throw new Error(
        `Page "${entry.id}" would shadow the reserved route "/${firstSegment}/". ` +
          `Reserved routes: ${RESERVED_PAGE_SEGMENTS.map((s) => `/${s}`).join(', ')}. ` +
          `Move it to a different path or rename the top-level folder under src/content/pages/.`,
      );
    }
  }
  return entries;
}

export async function getPublishedPosts() {
  const posts = await getCollection('blog', (entry) => isPublished(entry.data));
  return posts.sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );
}

export async function getPublishedAuthors() {
  return getCollection('authors');
}
