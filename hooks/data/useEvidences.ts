/**
 * Evidence Data Hooks (Ticket 009)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Evidence, EvidenceInsert, EvidenceUpdate } from '@/lib/supabase/types';

/**
 * Hook to fetch and subscribe to user's evidences
 *
 * @param userId - User ID to fetch evidences for
 * @returns Evidence data, loading state, error, and refetch function
 */
export function useEvidences(userId: string | undefined) {
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let subscription: any;

    async function fetchEvidences() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('evidences')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setEvidences(data || []);
      } catch (err) {
        console.error('Error fetching evidences:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchEvidences();

    // Set up real-time subscription
    subscription = supabase
      .channel(`evidences:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidences',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Evidence change detected:', payload);

          if (payload.eventType === 'INSERT') {
            setEvidences(prev => [payload.new as Evidence, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEvidences(prev =>
              prev.map(e => (e.id === payload.new.id ? (payload.new as Evidence) : e))
            );
          } else if (payload.eventType === 'DELETE') {
            setEvidences(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription?.unsubscribe();
    };
  }, [userId]);

  const refetch = async () => {
    if (!userId) return;

    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('evidences')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setEvidences(data || []);
    } catch (err) {
      console.error('Error refetching evidences:', err);
      setError(err as Error);
    }
  };

  return { evidences, loading, error, refetch };
}

/**
 * Hook to create a new evidence
 *
 * @returns createEvidence function and creation state
 */
export function useCreateEvidence() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createEvidence = async (evidence: EvidenceInsert): Promise<Evidence | null> => {
    try {
      setCreating(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('evidences')
        .insert(evidence)
        .select()
        .single();

      if (insertError) throw insertError;

      return data;
    } catch (err) {
      console.error('Error creating evidence:', err);
      setError(err as Error);
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { createEvidence, creating, error };
}

/**
 * Hook to update an existing evidence
 *
 * @returns updateEvidence function and update state
 */
export function useUpdateEvidence() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateEvidence = async (
    id: string,
    updates: EvidenceUpdate
  ): Promise<Evidence | null> => {
    try {
      setUpdating(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('evidences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return data;
    } catch (err) {
      console.error('Error updating evidence:', err);
      setError(err as Error);
      return null;
    } finally {
      setUpdating(false);
    }
  };

  return { updateEvidence, updating, error };
}

/**
 * Hook to delete an evidence
 *
 * @returns deleteEvidence function and deletion state
 */
export function useDeleteEvidence() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteEvidence = async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('evidences')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return true;
    } catch (err) {
      console.error('Error deleting evidence:', err);
      setError(err as Error);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteEvidence, deleting, error };
}
