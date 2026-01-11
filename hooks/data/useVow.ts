import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Vow } from '@/lib/supabase/types';

export function useVow(userId: string | undefined) {
  const [vow, setVow] = useState<Vow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchVow() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('vows')
          .select('*')
          .eq('user_id', userId)
          .eq('is_current', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        setVow(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchVow();
  }, [userId]);

  return { vow, loading, error };
}
