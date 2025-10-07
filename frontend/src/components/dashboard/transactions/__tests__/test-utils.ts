import { renderWithClient as baseRenderWithClient } from '../../__tests__/renderWithClient';
import { mockMetadataFetch } from '../../../common/__tests__/helpers';

type MetadataConfig = NonNullable<Parameters<typeof mockMetadataFetch>[0]>;

const DEFAULT_COLUMNS = [
  { id: 'type', label: 'Type' },
  { id: 'amount', label: 'Amount' },
  { id: 'date', label: 'Date' },
  { id: 'status', label: 'Status' },
];

function createMetadata(overrides?: MetadataConfig) {
  const base = {
    ...(overrides ?? {}),
    columns: overrides?.columns ?? DEFAULT_COLUMNS,
  } satisfies MetadataConfig & {
    columns: Array<{ id: string; label: string }>;
  };

  return base;
}

export function setupTransactionTestData(overrides?: MetadataConfig) {
  const defaultMetadata = createMetadata(overrides);

  const mockTransactionMetadata = (metadataOverrides?: MetadataConfig) => {
    const metadata = {
      ...defaultMetadata,
      ...(metadataOverrides ?? {}),
      columns: metadataOverrides?.columns ?? defaultMetadata.columns,
    } satisfies MetadataConfig & {
      columns: Array<{ id: string; label: string }>;
    };

    mockMetadataFetch(metadata);
  };

  mockTransactionMetadata();

  return {
    renderWithClient: baseRenderWithClient,
    mockTransactionMetadata,
  };
}
