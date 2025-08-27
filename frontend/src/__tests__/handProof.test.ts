/** @jest-environment node */
import { getHandProof } from '@/lib/api/hands';
import { HandProofSchema } from '@shared/types';

jest.mock('@/lib/base-url', () => ({ getBaseUrl: () => 'http://test' }));
const mockFetch = jest.fn();
jest.mock('@/lib/server-fetch', () => ({ serverFetch: (...args: any[]) => mockFetch(...args) }));
const mockHandle = jest.fn();
jest.mock('@/lib/api/client', () => ({ handleResponse: (...args: any[]) => mockHandle(...args) }));

describe('getHandProof', () => {
  it('requests proof from API', async () => {
    const resp = Promise.resolve({});
    mockFetch.mockReturnValue(resp);
    mockHandle.mockResolvedValue({ seed: 's', nonce: 'n', commitment: 'c' });
    const proof = await getHandProof('hand1');
    expect(mockFetch).toHaveBeenCalledWith('http://test/api/hands/hand1/proof');
    expect(mockHandle).toHaveBeenCalledWith(resp, HandProofSchema);
    expect(proof).toEqual({ seed: 's', nonce: 'n', commitment: 'c' });
  });
});
