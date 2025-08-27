import type {
  PrizeCalcRequest,
  PrizeCalcResponse,
  TournamentInfo,
} from '@shared/types';

export async function listTournaments(): Promise<TournamentInfo[]> {
  const res = await fetch('/api/tournaments');
  if (!res.ok) throw new Error('Failed to fetch tournaments');
  return (await res.json()) as TournamentInfo[];
}

export async function calculatePrizes(
  req: PrizeCalcRequest,
): Promise<PrizeCalcResponse> {
  const res = await fetch('/api/tournaments/prizes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Failed to calculate prizes');
  return (await res.json()) as PrizeCalcResponse;
}
