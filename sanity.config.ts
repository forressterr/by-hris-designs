import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';

function assertValue<T>(v: T | undefined, msg: string): T {
  if (v === undefined) throw new Error(msg);
  return v;
}

const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing NEXT_PUBLIC_SANITY_PROJECT_ID',
);
const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing NEXT_PUBLIC_SANITY_DATASET',
);

export default defineConfig({
  name: 'default',
  title: 'By_Hris Designs',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [structureTool({ structure }), visionTool()],
  schema: { types: schemaTypes },
});
