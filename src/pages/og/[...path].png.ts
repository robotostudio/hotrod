import type { APIRoute, GetStaticPaths } from 'astro';
import {
  getPublishedAuthors,
  getPublishedPages,
  getPublishedPosts,
} from '../../lib/content';
import { renderOgImage, type OgVariant } from '../../lib/og-image';

type OgRouteProps = {
  title: string;
  variant: OgVariant;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const [pages, posts, authors] = await Promise.all([
    getPublishedPages(),
    getPublishedPosts(),
    getPublishedAuthors(),
  ]);

  const entries: Array<{ params: { path: string }; props: OgRouteProps }> = [];

  for (const page of pages) {
    const isHome = page.id === 'index';
    entries.push({
      params: { path: isHome ? 'index' : page.id },
      props: { title: page.data.title, variant: isHome ? 'home' : 'page' },
    });
  }

  entries.push({
    params: { path: 'blog' },
    props: { title: 'Blog', variant: 'page' },
  });
  entries.push({
    params: { path: 'authors' },
    props: { title: 'Authors', variant: 'page' },
  });

  for (const post of posts) {
    entries.push({
      params: { path: `blog/${post.id}` },
      props: { title: post.data.title, variant: 'page' },
    });
  }

  for (const author of authors) {
    entries.push({
      params: { path: `authors/${author.id}` },
      props: { title: author.data.name, variant: 'page' },
    });
  }

  return entries;
};

export const GET: APIRoute = async ({ props }) => {
  const { title, variant } = props as OgRouteProps;
  const bytes = await renderOgImage({ title, variant });
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
