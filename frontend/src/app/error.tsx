'use client';

import RouteError from './components/ui/route-error';

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
