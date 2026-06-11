import { defineField, defineType } from 'sanity';

export const labs = defineType({
  name: 'labs',
  title: 'Labs',
  type: 'document',
  fields: [
    defineField({
      name: 'about',
      title: 'Strands (about Labs)',
      type: 'array',
      of: [{ type: 'labsStrand' }],
    }),
    defineField({
      name: 'stats',
      title: 'Home teaser stats',
      type: 'array',
      of: [{ type: 'labsStat' }],
    }),
  ],
  preview: { prepare: () => ({ title: 'Labs' }) },
});
