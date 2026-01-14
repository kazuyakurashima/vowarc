import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MapNode, MapNodeType, MapNodeInsert, MapNodeUpdate, MapNodeVersion } from '@/lib/supabase/types';

export function useMapNodes(userId: string | undefined, filterType?: MapNodeType) {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNodes = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('map_nodes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filterType) {
        query = query.eq('type', filterType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setNodes(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId, filterType]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const addNode = async (node: Omit<MapNodeInsert, 'user_id'>) => {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('map_nodes')
      .insert({
        ...node,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;

    setNodes((prev) => [data, ...prev]);
    return data;
  };

  const updateNode = async (nodeId: string, updates: MapNodeUpdate) => {
    const { data, error } = await supabase
      .from('map_nodes')
      .update(updates)
      .eq('id', nodeId)
      .select()
      .single();

    if (error) throw error;

    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? data : n))
    );
    return data;
  };

  const deleteNode = async (nodeId: string) => {
    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('map_nodes')
      .update({ is_active: false })
      .eq('id', nodeId);

    if (error) throw error;

    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
  };

  const getNodeVersions = async (nodeId: string): Promise<MapNodeVersion[]> => {
    const { data, error } = await supabase
      .from('map_node_versions')
      .select('*')
      .eq('node_id', nodeId)
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  return {
    nodes,
    loading,
    error,
    refetch: fetchNodes,
    addNode,
    updateNode,
    deleteNode,
    getNodeVersions,
  };
}

// Hook to get nodes grouped by type
export function useMapNodesGrouped(userId: string | undefined) {
  const { nodes, loading, error, refetch, addNode, updateNode, deleteNode, getNodeVersions } =
    useMapNodes(userId);

  const groupedNodes = nodes.reduce(
    (acc, node) => {
      if (!acc[node.type]) {
        acc[node.type] = [];
      }
      acc[node.type].push(node);
      return acc;
    },
    {} as Record<MapNodeType, MapNode[]>
  );

  return {
    groupedNodes,
    vow: groupedNodes.vow?.[0] || null, // Only one vow
    meaning: groupedNodes.meaning?.[0] || null, // Only one meaning
    values: groupedNodes.value || [],
    strengths: groupedNodes.strength || [],
    antiPatterns: groupedNodes.anti_pattern || [],
    achievements: groupedNodes.achievement || [],
    loading,
    error,
    refetch,
    addNode,
    updateNode,
    deleteNode,
    getNodeVersions,
  };
}

// Helper to create initial nodes from Day0 data
export async function createInitialMapNodes(
  userId: string,
  vow: string,
  meaningStatement: string,
  antiPatterns: string[]
) {
  const nodesToInsert: MapNodeInsert[] = [
    {
      user_id: userId,
      type: 'vow',
      content: vow,
      source_type: 'day0',
    },
    {
      user_id: userId,
      type: 'meaning',
      content: meaningStatement,
      source_type: 'day0',
    },
    ...antiPatterns.map((pattern) => ({
      user_id: userId,
      type: 'anti_pattern' as MapNodeType,
      content: pattern,
      source_type: 'day0' as const,
    })),
  ];

  const { data, error } = await supabase
    .from('map_nodes')
    .insert(nodesToInsert)
    .select();

  if (error) throw error;
  return data;
}

// Helper to create achievement from evidence
export async function createAchievementFromEvidence(
  userId: string,
  evidenceId: string,
  title: string
) {
  const { data, error } = await supabase
    .from('map_nodes')
    .insert({
      user_id: userId,
      type: 'achievement',
      content: title,
      source_type: 'evidence',
      source_id: evidenceId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
