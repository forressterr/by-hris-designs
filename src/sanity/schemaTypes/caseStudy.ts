import { defineField, defineType } from 'sanity';

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case study',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({
      name: 'overview',
      title: 'Overview',
      type: 'object',
      fields: [
        defineField({ name: 'hero', title: 'Hero', type: 'caseImage' }),
        defineField({
          name: 'themes',
          title: 'Theme variants',
          type: 'array',
          of: [{ type: 'screenTab' }],
        }),
        defineField({ name: 'lead', title: 'Lead', type: 'text' }),
      ],
    }),
    defineField({ name: 'problem', title: 'Problem', type: 'text' }),
    defineField({ name: 'process', title: 'Process', type: 'text' }),
    defineField({
      name: 'screens',
      title: 'Key screens',
      type: 'array',
      of: [{ type: 'caseImage' }],
    }),
    defineField({
      name: 'mobile',
      title: 'Mobile screens',
      type: 'array',
      of: [{ type: 'caseImage' }],
    }),
    defineField({
      name: 'scrollViewport',
      title: 'Scroll viewport',
      type: 'object',
      fields: [
        defineField({ name: 'src', title: 'Source path', type: 'string' }),
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'hotspots',
      title: 'Hotspots',
      type: 'object',
      fields: [
        defineField({ name: 'src', title: 'Source path', type: 'string' }),
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
        defineField({
          name: 'callouts',
          title: 'Callouts',
          type: 'array',
          of: [{ type: 'hotspotCallout' }],
        }),
      ],
    }),
    defineField({
      name: 'switcher',
      title: 'Screen switcher',
      type: 'array',
      of: [{ type: 'screenTab' }],
    }),
    defineField({
      name: 'outcome',
      title: 'Outcome',
      type: 'object',
      fields: [
        defineField({ name: 'copy', title: 'Copy', type: 'text' }),
        defineField({
          name: 'stats',
          title: 'Stats',
          type: 'array',
          of: [{ type: 'stat' }],
        }),
      ],
    }),
  ],
});
