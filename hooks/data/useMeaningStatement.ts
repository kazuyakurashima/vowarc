import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MeaningStatement } from '@/lib/supabase/types';

export function useMeaningStatement(userId: string | undefined) {
  const [meaningStatement, setMeaningStatement] = useState<MeaningStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchMeaningStatement() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('meaning_statements')
          .select('*')
          .eq('user_id', userId)
          .eq('is_current', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        setMeaningStatement(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchMeaningStatement();
  }, [userId]);

  return { meaningStatement, loading, error };
}
