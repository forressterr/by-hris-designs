import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('project').title('Projects'),
      S.listItem()
        .title('Labs')
        .id('labs')
        .child(S.document().schemaType('labs').documentId('labs')),
    ]);
