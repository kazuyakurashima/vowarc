import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Memory } from '@/lib/supabase/types';

export function useMemories(userId: string | undefined) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchMemories() {
      try {
        setLoading(true);

        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('memories')
          .select('*')
          .eq('user_id', userId)
          .or(`expires_at.is.null,expires_at.gt.${now}`) // Active memories only
          .order('created_at', { ascending: false });

        if (error) throw error;

        setMemories(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchMemories();
  }, [userId]);

  return { memories, loading, error };
}

/**
 * Get memories by type
 */
export function useMemoriesByType(userId: string | undefined, type: 'short_term' | 'milestone') {
  const { memories, loading, error } = useMemories(userId);

  return {
    memories: memories.filter(m => m.memory_type === type),
    loading,
    error,
  };
}
