"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function QueryCheck() {
  const [hasClient, setHasClient] = useState<boolean | null>(null);
  
  let client: unknown = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    client = useQueryClient();
  } catch {
    // ignore
  }

  useEffect(() => {
    Promise.resolve().then(() => setHasClient(!!client));
  }, [client]);

  if (hasClient === null) return <div>Checking Query Client...</div>;
  return (
    <div style={{ position: 'fixed', bottom: 10, right: 10, padding: 10, background: hasClient ? 'green' : 'red', color: 'white' }}>
      Query Client Status: {hasClient ? 'PROVDIED' : 'MISSING'}
    </div>
  );
}
