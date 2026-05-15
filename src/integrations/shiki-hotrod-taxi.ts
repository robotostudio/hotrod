import type { ShikiConfig } from 'astro';

/**
 * Hotrod's custom Shiki theme. Yellow-on-near-black, tuned to sit inside the
 * black post-body section without clashing with the brand. Picks a small set
 * of warm hues so the syntax stays legible without leaving the brand palette.
 */
export const hotrodTaxiTheme: NonNullable<ShikiConfig['theme']> = {
  name: 'hotrod-taxi',
  type: 'dark',
  colors: {
    'editor.background': '#1a1500',
    'editor.foreground': '#FFD700',
  },
  fg: '#FFD700',
  bg: '#1a1500',
  settings: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#8a7a30', fontStyle: 'italic' },
    },
    {
      scope: ['string', 'string.template', 'string.quoted'],
      settings: { foreground: '#FFF59D' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character'],
      settings: { foreground: '#FFC107' },
    },
    {
      scope: ['constant.language.boolean', 'constant.language.null'],
      settings: { foreground: '#FFC107', fontStyle: 'bold' },
    },
    {
      scope: [
        'keyword',
        'keyword.control',
        'keyword.operator.expression',
        'keyword.operator.new',
        'storage.type',
        'storage.modifier',
      ],
      settings: { foreground: '#FFEB3B', fontStyle: 'bold' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#FFFFFF' },
    },
    {
      scope: ['entity.name.class', 'entity.name.type', 'support.type', 'support.class'],
      settings: { foreground: '#FFCA28' },
    },
    {
      scope: ['variable', 'variable.other', 'variable.parameter'],
      settings: { foreground: '#FFD700' },
    },
    {
      scope: ['punctuation', 'meta.brace', 'keyword.operator'],
      settings: { foreground: '#FFC107' },
    },
    {
      scope: ['entity.name.tag', 'meta.tag'],
      settings: { foreground: '#FFEB3B' },
    },
    {
      scope: ['entity.other.attribute-name'],
      settings: { foreground: '#FFCA28', fontStyle: 'italic' },
    },
    {
      scope: ['markup.heading', 'markup.heading.markdown'],
      settings: { foreground: '#FFEB3B', fontStyle: 'bold' },
    },
    {
      scope: ['markup.bold'],
      settings: { fontStyle: 'bold' },
    },
    {
      scope: ['markup.italic'],
      settings: { fontStyle: 'italic' },
    },
    {
      scope: ['markup.inline.raw', 'markup.fenced_code'],
      settings: { foreground: '#FFF59D' },
    },
    {
      scope: ['markup.underline.link', 'string.other.link'],
      settings: { foreground: '#FFFFFF', fontStyle: 'underline' },
    },
    {
      scope: ['invalid', 'invalid.illegal'],
      settings: { foreground: '#FF5252' },
    },
  ],
};
