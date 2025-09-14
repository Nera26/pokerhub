import { shuffle, standardDeck, verifyProof, hexToBytes } from '../shared/verify';
import type { HandProofResponse } from '../shared/types';

export async function verifyHandProof(
  handId: string,
  baseUrl = process.env.POKERHUB_BASE_URL || 'http://localhost:3000',
) {
  const proofRes = await fetch(`${baseUrl}/hands/${handId}/proof`);
  if (!proofRes.ok) throw new Error('Failed to fetch proof');
  const proof = (await proofRes.json()) as HandProofResponse;
  if (!verifyProof(proof)) throw new Error('Invalid proof: commitment mismatch');

  const logRes = await fetch(`${baseUrl}/hands/${handId}/log`);
  if (!logRes.ok) throw new Error('Failed to fetch log');
  const logText = await logRes.text();

  let deck: (number | undefined)[] | undefined;
  for (const line of logText.trim().split('\n')) {
    if (!line) continue;
    if (line.startsWith('[')) {
      try {
        const entry = JSON.parse(line);
        const d = entry[2]?.deck as Array<number | null> | undefined;
        if (Array.isArray(d)) {
          deck = d.map((v) => (v == null ? undefined : v));
          break;
        }
      } catch {}
    }
  }
  if (!Array.isArray(deck)) throw new Error('Deck not found in log');

  const expected = shuffle(standardDeck(), hexToBytes(proof.seed));
  const match =
    deck.length === expected.length && deck.every((v, i) => v === expected[i]);
  if (!match) throw new Error('Deck mismatch');
}
