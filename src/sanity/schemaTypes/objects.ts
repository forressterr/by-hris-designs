import { defineField, defineType } from 'sanity';

// Image referenced by a public/ path string (images stay in the repo — Phase 4
// decision). Validated to start with "/".
const pathString = (name: string, title: string, required = false) =>
  defineField({
    name,
    title,
    type: 'string',
    validation: (rule) => {
      const r = rule.regex(/^\//);
      return required ? r.required() : r;
    },
  });

export const caseImage = defineType({
  name: 'caseImage',
  title: 'Image',
  type: 'object',
  fields: [
    pathString('src', 'Source path', true),
    defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
  ],
});

export const screenTab = defineType({
  name: 'screenTab',
  title: 'Screen tab',
  type: 'object',
  fields: [
    defineField({ name: 'id', title: 'Id', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    pathString('src', 'Source path'),
    defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
  ],
});

export const hotspotCallout = defineType({
  name: 'hotspotCallout',
  title: 'Callout',
  type: 'object',
  fields: [
    defineField({ name: 'x', title: 'X %', type: 'number' }),
    defineField({ name: 'y', title: 'Y %', type: 'number' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text' }),
  ],
});

export const stat = defineType({
  name: 'stat',
  title: 'Stat',
  type: 'object',
  fields: [
    defineField({ name: 'value', title: 'Value', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
  ],
});

export const labsStrand = defineType({
  name: 'labsStrand',
  title: 'Labs strand',
  type: 'object',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'desc', title: 'Description', type: 'text' }),
  ],
});

export const labsStat = defineType({
  name: 'labsStat',
  title: 'Labs stat',
  type: 'object',
  fields: [
    defineField({ name: 'value', title: 'Value', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
  ],
});
