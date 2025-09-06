'use client';

import RouteError from './components/ui/RouteError';

export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <RouteError {...props} />
      </body>
    </html>
  );
}
