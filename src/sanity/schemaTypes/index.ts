import type { SchemaTypeDefinition } from 'sanity';
import {
  caseImage,
  screenTab,
  hotspotCallout,
  stat,
  labsStrand,
  labsStat,
} from './objects';
import { caseStudy } from './caseStudy';
import { project } from './project';
import { labs } from './labs';

export const schemaTypes: SchemaTypeDefinition[] = [
  // documents
  project,
  labs,
  // objects
  caseStudy,
  caseImage,
  screenTab,
  hotspotCallout,
  stat,
  labsStrand,
  labsStat,
];
