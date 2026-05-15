const WORDS_PER_MINUTE = 200;

export function readingTime(body: string | undefined): string {
  if (!body) return '1 min read';
  const wordCount = body.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
