import React, { type ReactElement, useEffect, useState } from 'react';

type Props = {
  children: ReactElement;
  fallback?: ReactElement;
};

export function ClientOnly({ children, fallback }: Props): ReactElement | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return fallback || null;
  }

  return children;
}
