import { defineField, defineType } from 'sanity';

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower sorts first; preserves the original list order.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cover',
      title: 'Cover path',
      type: 'string',
      validation: (rule) => rule.required().regex(/^\//),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'date', title: 'Date chip', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'headline', title: 'Headline', type: 'text' }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'year', title: 'Year', type: 'string' }),
    defineField({ name: 'client', title: 'Client', type: 'string' }),
    defineField({ name: 'timeline', title: 'Timeline', type: 'string' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ['Closed', 'Finished', 'In progress'] },
    }),
    defineField({ name: 'caseStudy', title: 'Case study', type: 'caseStudy' }),
  ],
  orderings: [
    {
      title: 'Manual order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'year' },
  },
});
