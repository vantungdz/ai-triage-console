'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function importFixture() {
    setLoading(true);
    try {
      const response = await fetch('/api/import', { method: 'POST' });
      if (!response.ok) throw new Error('Import failed');
      router.refresh();
    } catch (error) {
      window.alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="btn" type="button" onClick={importFixture} disabled={loading}>
      {loading ? 'Importing…' : 'Import fixture'}
    </button>
  );
}
