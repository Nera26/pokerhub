import { useEffect } from 'react';

export default function useRenderCount(name: string) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.count(name);
    }
  });
}
