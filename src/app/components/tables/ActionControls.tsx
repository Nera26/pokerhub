'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';

export interface ActionControlsProps {
  currentBet: number; // highest "to" (commitment) this street
  callAmount: number; // how much hero must put in to call now
  pot: number; // current pot before hero acts
  effective: number; // effective stack (vs biggest opponent)

  bigBlind: number;
  minTotal: number; // min legal "raise to" (or min bet when toCall=0)
  maxTotal: number; // all-in cap (already limited by effective)
  sliderTotal: number;
  onSliderChange: (v: number) => void;

  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaiseTo: (total: number) => void;

  isHeroTurn: boolean;
  autoCheckFold: boolean;
  onToggleAutoCheckFold: (v: boolean) => void;
  autoFoldAny: boolean;
  onToggleAutoFoldAny: (v: boolean) => void;
  autoCallAny: boolean;
  onToggleAutoCallAny: (v: boolean) => void;
}

export interface BetInputProps {
  currentBet: number;
  callAmount: number;
  pot: number;
  effective: number;

  bigBlind: number;
  minTotal: number;
  maxTotal: number;
  sliderTotal: number;
  onSliderChange: (v: number) => void;
}

export function BetInput({
  currentBet,
  callAmount,
  pot,
  effective,
  bigBlind,
  minTotal,
  maxTotal,
  sliderTotal,
  onSliderChange,
}: BetInputProps) {
  const [typed, setTyped] = useState(String(sliderTotal));

  // --- helpers: snap/clamp to BB and legal bounds ---
  const snapBB = (n: number) => Math.round(n / bigBlind) * bigBlind;
  const clampSnap = (n: number) => {
    const snapped = snapBB(n);
    return Math.max(minTotal, Math.min(maxTotal, snapped));
  };
  const setTotal = (n: number) => {
    const v = clampSnap(n);
    setTyped(String(v));
    onSliderChange(v);
  };

  // Pot odds
  const potOddsPct = useMemo(() => {
    if (callAmount <= 0) return 0;
    return Math.round((callAmount / (pot + callAmount)) * 100);
  }, [pot, callAmount]);

  // Presets → always land on a legal "raise to"
  const presetFrac = (f: number) => {
    const targetRaiseTo = (pot + callAmount) * f + currentBet;
    setTotal(targetRaiseTo);
  };
  const presetPot = () => {
    // standard "pot-sized raise to" suggestion (then snapped/clamped)
    const candidate =
      callAmount > 0
        ? currentBet + 2 * callAmount + pot
        : Math.max(pot, minTotal);
    setTotal(candidate);
  };
  const presetAllIn = () => setTotal(maxTotal);

  // Steppers
  const step = (bbs: number) => setTotal(sliderTotal + bbs * bigBlind);

  // Slider ticks
  const tick1 = clampSnap(bigBlind);
  const tick2 = clampSnap(2 * bigBlind);
  const tick3 = clampSnap(3 * bigBlind);
  const tick5 = clampSnap(5 * bigBlind);
  const tick10 = clampSnap(10 * bigBlind);
  const tickPot = clampSnap(Math.max(pot, minTotal));
  const tickAI = maxTotal;

  // Numeric input: snap/clamp on blur
  const onTypedBlur = () => {
    const n = Number(typed);
    if (Number.isFinite(n)) setTotal(n);
    else setTyped(String(sliderTotal));
  };

  return (
    <>
      {/* Presets */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
        <Button variant="ghost" onClick={() => presetFrac(0.25)}>
          ¼
        </Button>
        <Button variant="ghost" onClick={() => presetFrac(0.5)}>
          ½
        </Button>
        <Button variant="ghost" onClick={() => presetFrac(2 / 3)}>
          ⅔
        </Button>
        <Button variant="ghost" onClick={presetPot}>
          Pot
        </Button>
        <Button variant="danger" onClick={presetAllIn}>
          All-in
        </Button>
      </div>

      {/* Amount controls */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">Bet / Raise To</span>
          <span className="text-lg font-bold text-accent-yellow">
            ${sliderTotal}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="ghost" onClick={() => step(-5)}>
            -5 BB
          </Button>
          <Button variant="ghost" onClick={() => step(-1)}>
            -1 BB
          </Button>

          <input
            type="range"
            min={minTotal}
            max={maxTotal}
            value={sliderTotal}
            onChange={(e) => setTotal(Number(e.target.value))}
            className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer"
            list="bet-ticks"
            aria-label="Bet amount"
          />

          <Button variant="ghost" onClick={() => step(+1)}>
            +1 BB
          </Button>
          <Button variant="ghost" onClick={() => step(+5)}>
            +5 BB
          </Button>

          <input
            className="w-24 sm:w-28 bg-dark-bg border border-border-dark rounded-xl px-2 py-1 text-right"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onBlur={onTypedBlur}
            aria-label="Type amount"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={`${minTotal}`}
          />
        </div>

        <datalist id="bet-ticks">
          <option value={tick1} />
          <option value={tick2} />
          <option value={tick3} />
          <option value={tick5} />
          <option value={tick10} />
          <option value={tickPot} />
          <option value={tickAI} />
        </datalist>

        <div className="mt-1 text-xs text-text-secondary text-center">
          Pot: <b>${pot}</b> • To call: <b>${callAmount}</b> • Effective:{' '}
          <b>${effective}</b>
          {callAmount > 0 && (
            <>
              {' '}
              • Pot odds: <b>{potOddsPct}%</b>
            </>
          )}
        </div>

        {callAmount > 0 && (
          <div className="mt-1 text-[11px] text-text-secondary text-center">
            Min raise: <b>${minTotal}</b>
          </div>
        )}
      </div>
    </>
  );
}

export interface AutoActionsProps {
  autoCheckFold: boolean;
  onToggleAutoCheckFold: (v: boolean) => void;
  autoFoldAny: boolean;
  onToggleAutoFoldAny: (v: boolean) => void;
  autoCallAny: boolean;
  onToggleAutoCallAny: (v: boolean) => void;
}

export function AutoActions({
  autoCheckFold,
  onToggleAutoCheckFold,
  autoFoldAny,
  onToggleAutoFoldAny,
  autoCallAny,
  onToggleAutoCallAny,
}: AutoActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center mt-3">
      <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={autoCheckFold}
          onChange={(e) => onToggleAutoCheckFold(e.target.checked)}
          className="rounded"
        />
        <span>Check/Fold</span>
      </label>
      <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={autoFoldAny}
          onChange={(e) => onToggleAutoFoldAny(e.target.checked)}
          className="rounded"
        />
        <span>Fold to any bet</span>
      </label>
      <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={autoCallAny}
          onChange={(e) => onToggleAutoCallAny(e.target.checked)}
          className="rounded"
        />
        <span>Call any</span>
      </label>
    </div>
  );
}

export default function ActionControls({
  currentBet,
  callAmount,
  pot,
  effective,
  bigBlind,
  minTotal,
  maxTotal,
  sliderTotal,
  onSliderChange,
  onFold,
  onCheck,
  onCall,
  onRaiseTo,
  isHeroTurn,
  autoCheckFold,
  onToggleAutoCheckFold,
  autoFoldAny,
  onToggleAutoFoldAny,
  autoCallAny,
  onToggleAutoCallAny,
}: ActionControlsProps) {
  const labelPrimary =
    currentBet === 0 ? `Bet $${sliderTotal}` : `Raise to $${sliderTotal}`;

  const isBBStep = sliderTotal % bigBlind === 0;
  const isIllegal =
    sliderTotal < minTotal || sliderTotal > maxTotal || !isBBStep;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      if (key === 'f' && callAmount > 0) onFold();
      if (key === 'c') (callAmount > 0 ? onCall : onCheck)();
      if (key === 'r' && !isIllegal) onRaiseTo(sliderTotal);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [callAmount, isIllegal, sliderTotal, onFold, onCall, onCheck, onRaiseTo]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card-bg border-t border-border-dark p-4 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto">
        <BetInput
          currentBet={currentBet}
          callAmount={callAmount}
          pot={pot}
          effective={effective}
          bigBlind={bigBlind}
          minTotal={minTotal}
          maxTotal={maxTotal}
          sliderTotal={sliderTotal}
          onSliderChange={onSliderChange}
        />

        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="danger" onClick={onFold} disabled={callAmount === 0}>
            Fold (F)
          </Button>

          {callAmount > 0 ? (
            <Button variant="secondary" onClick={onCall}>
              Call ${callAmount} (C)
            </Button>
          ) : (
            <Button variant="secondary" onClick={onCheck}>
              Check (C)
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => onRaiseTo(sliderTotal)}
            disabled={isIllegal}
            title={isIllegal ? `Min raise: $${minTotal}` : undefined}
          >
            {labelPrimary} (R)
          </Button>
        </div>

        {!isHeroTurn && (
          <AutoActions
            autoCheckFold={autoCheckFold}
            onToggleAutoCheckFold={onToggleAutoCheckFold}
            autoFoldAny={autoFoldAny}
            onToggleAutoFoldAny={onToggleAutoFoldAny}
            autoCallAny={autoCallAny}
            onToggleAutoCallAny={onToggleAutoCallAny}
          />
        )}
      </div>
    </div>
  );
}
