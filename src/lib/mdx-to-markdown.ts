/**
 * Convert an MDX post body to plain markdown suitable for agent consumption.
 *
 *   - Strips top-of-file `import` statements (they're component plumbing, not
 *     content).
 *   - Rewrites every <PostCTA /> tag (with or without prop overrides) as a
 *     markdown blockquote, so the call-to-action is preserved as readable
 *     prose rather than vanishing or appearing as raw JSX.
 *
 * The PostCTA defaults are duplicated here from src/components/post-cta.astro
 * deliberately — these are the canonical "what to render if the post didn't
 * override this prop" strings. If you change the component defaults, change
 * them here too. There is no shared source of truth because the component
 * file is an .astro module and importing it into a plain TypeScript helper
 * is not free.
 */

const POST_CTA_DEFAULTS = {
  heading: 'LIKE WHAT YOU SEE?',
  text: "The team that built Hotrod builds production sites for a living. Hand the brief over and skip the part where you fight the framework.",
  buttonLabel: 'GET IN TOUCH',
  href: '/contact',
} as const;

const IMPORT_LINE = /^\s*import\s+[^\n]+?\n/gm;
const POST_CTA_TAG = /<PostCTA\s*([^/]*?)\s*\/>/g;
const ATTR = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\})/g;

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  let match: RegExpExecArray | null;
  while ((match = ATTR.exec(raw)) !== null) {
    const [, key, dq, sq, btq, bdq] = match;
    out[key] = dq ?? sq ?? btq ?? bdq ?? '';
  }
  return out;
}

function renderPostCTA(attrs: Record<string, string>): string {
  const heading = attrs.heading ?? POST_CTA_DEFAULTS.heading;
  const text = attrs.text ?? POST_CTA_DEFAULTS.text;
  const label = attrs.buttonLabel ?? POST_CTA_DEFAULTS.buttonLabel;
  const href = attrs.href ?? POST_CTA_DEFAULTS.href;
  return ['> **' + heading + '**', '>', '> ' + text, '>', `> → [${label}](${href})`].join('\n');
}

export function mdxToMarkdown(body: string): string {
  const withoutImports = body.replace(IMPORT_LINE, '');
  const withCTAs = withoutImports.replace(POST_CTA_TAG, (_, attrs: string) =>
    renderPostCTA(parseAttrs(attrs)),
  );
  return withCTAs.replace(/^\s+/, '').replace(/\s+$/, '') + '\n';
}
