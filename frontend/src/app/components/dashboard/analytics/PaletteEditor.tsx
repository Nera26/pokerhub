'use client';

import { useEffect, useState } from 'react';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useUpdateChartPalette } from '@/hooks/useUpdateChartPalette';
import useToasts from '@/hooks/useToasts';

export default function PaletteEditor() {
  const { data: palette } = useChartPalette();
  const [colors, setColors] = useState<string[]>([]);
  const { pushToast } = useToasts();
  const mutation = useUpdateChartPalette();

  useEffect(() => {
    setColors(palette ?? []);
  }, [palette]);

  const updateColor = (i: number, value: string) => {
    setColors((prev) => prev.map((c, idx) => (idx === i ? value : c)));
  };

  const addColor = () => setColors((prev) => [...prev, '#000000']);
  const removeColor = (i: number) =>
    setColors((prev) => prev.filter((_, idx) => idx !== i));

  const save = () =>
    mutation.mutate(colors, {
      onSuccess: () => pushToast('Palette updated'),
      onError: () =>
        pushToast('Failed to update palette', { variant: 'error' }),
    });

  if (!palette) return null;

  return (
    <div className="bg-card-bg rounded-2xl p-4 card-shadow">
      <h3 className="text-lg font-semibold mb-2">Chart Palette</h3>
      <div className="flex flex-col gap-2 mb-4">
        {colors.map((color, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              aria-label={`Color ${i + 1}`}
              type="color"
              value={color}
              onChange={(e) => updateColor(i, e.target.value)}
              className="h-8 w-12 bg-transparent border-none"
            />
            <button
              type="button"
              onClick={() => removeColor(i)}
              className="text-sm text-accent-red"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addColor}
          className="text-sm text-accent-blue self-start"
        >
          Add color
        </button>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={mutation.isLoading}
        className="bg-accent-green hover:bg-green-600 px-4 py-2 rounded-xl font-semibold text-white"
      >
        Save Palette
      </button>
    </div>
  );
}
