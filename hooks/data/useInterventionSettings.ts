import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserInterventionSettings } from '@/lib/supabase/types';
import { buildApiUrl } from '@/lib/api-config';
import { INTERVENTION_AREAS, InterventionAreaKey } from '@/lib/openai/coach';

export interface InterventionSettingsState {
  interveneAreas: InterventionAreaKey[];
  noTouchAreas: InterventionAreaKey[];
}

const DEFAULT_SETTINGS: InterventionSettingsState = {
  interveneAreas: ['anti_pattern', 'time_excuse'],
  noTouchAreas: [],
};

export function useInterventionSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<InterventionSettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch settings
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchSettings() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('user_intervention_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettings({
            interveneAreas: (data.intervene_areas as InterventionAreaKey[]) || DEFAULT_SETTINGS.interveneAreas,
            noTouchAreas: (data.no_touch_areas as InterventionAreaKey[]) || DEFAULT_SETTINGS.noTouchAreas,
          });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [userId]);

  // Update settings
  const updateSettings = useCallback(async (
    newInterveneAreas: InterventionAreaKey[],
    newNoTouchAreas: InterventionAreaKey[]
  ) => {
    if (!userId) return false;

    try {
      setSaving(true);
      setError(null);

      // Get JWT token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(buildApiUrl('/api/settings/intervention'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          intervene_areas: newInterveneAreas,
          no_touch_areas: newNoTouchAreas,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const data = await response.json();

      setSettings({
        interveneAreas: data.settings.intervene_areas,
        noTouchAreas: data.settings.no_touch_areas,
      });

      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId]);

  // Toggle area in intervene list
  const toggleInterveneArea = useCallback(async (area: InterventionAreaKey) => {
    const newInterveneAreas = settings.interveneAreas.includes(area)
      ? settings.interveneAreas.filter(a => a !== area)
      : [...settings.interveneAreas, area];

    // Remove from no-touch if adding to intervene
    const newNoTouchAreas = newInterveneAreas.includes(area)
      ? settings.noTouchAreas.filter(a => a !== area)
      : settings.noTouchAreas;

    return updateSettings(newInterveneAreas, newNoTouchAreas);
  }, [settings, updateSettings]);

  // Toggle area in no-touch list
  const toggleNoTouchArea = useCallback(async (area: InterventionAreaKey) => {
    const newNoTouchAreas = settings.noTouchAreas.includes(area)
      ? settings.noTouchAreas.filter(a => a !== area)
      : [...settings.noTouchAreas, area];

    // Remove from intervene if adding to no-touch
    const newInterveneAreas = newNoTouchAreas.includes(area)
      ? settings.interveneAreas.filter(a => a !== area)
      : settings.interveneAreas;

    return updateSettings(newInterveneAreas, newNoTouchAreas);
  }, [settings, updateSettings]);

  return {
    settings,
    loading,
    saving,
    error,
    updateSettings,
    toggleInterveneArea,
    toggleNoTouchArea,
    availableAreas: INTERVENTION_AREAS,
  };
}
