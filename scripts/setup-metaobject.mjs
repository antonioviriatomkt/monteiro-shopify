// Creates the "Reseller" metaobject definition.
// Idempotent: if a definition with type "reseller" already exists, skips creation.

import { graphql } from './lib.mjs';

const TYPE = 'reseller';

const existingQuery = `
  query Existing($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
      name
      type
      fieldDefinitions { key name type { name } required }
    }
  }
`;

const createMutation = `
  mutation Create($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        id
        name
        type
        fieldDefinitions { key name type { name } required }
      }
      userErrors { field message code }
    }
  }
`;

const existing = await graphql(existingQuery, { type: TYPE });
if (existing.metaobjectDefinitionByType) {
  console.log('Reseller metaobject definition already exists:');
  console.log(JSON.stringify(existing.metaobjectDefinitionByType, null, 2));
  process.exit(0);
}

const definition = {
  name: 'Reseller',
  type: TYPE,
  displayNameKey: 'name',
  access: { storefront: 'PUBLIC_READ' },
  capabilities: { publishable: { enabled: true } },
  fieldDefinitions: [
    {
      key: 'logo',
      name: 'Logo',
      type: 'file_reference',
      required: true,
      validations: [
        { name: 'file_type_options', value: JSON.stringify(['Image']) },
      ],
    },
    { key: 'name',    name: 'Name',    type: 'single_line_text_field', required: true },
    { key: 'country', name: 'Country', type: 'single_line_text_field', required: true },
    { key: 'website', name: 'Website', type: 'url',                    required: true },
  ],
};

const data = await graphql(createMutation, { definition });
const result = data.metaobjectDefinitionCreate;
if (result.userErrors.length) {
  console.error('User errors:', JSON.stringify(result.userErrors, null, 2));
  process.exit(1);
}
console.log('Created metaobject definition:');
console.log(JSON.stringify(result.metaobjectDefinition, null, 2));
