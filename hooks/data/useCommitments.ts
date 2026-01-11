import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Commitment } from '@/lib/supabase/types';

export function useCommitments(userId: string | undefined, date?: Date) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchCommitments() {
      try {
        setLoading(true);

        const targetDate = date || new Date();
        const dateString = targetDate.toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('commitments')
          .select('*')
          .eq('user_id', userId)
          .eq('due_date', dateString)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setCommitments(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchCommitments();
  }, [userId, date]);

  return { commitments, loading, error };
}
