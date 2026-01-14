/**
 * VowArc Purchase Hook
 *
 * Manages purchase state and operations for the 9-week coaching package
 * Based on Ticket 008 specification (Non-Renewing Subscription)
 */

import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  purchaseCoachingPackage,
  restorePurchases,
  getCoachingPackage,
  PurchasesPackage,
} from '@/lib/revenuecat';

export interface PurchaseStatus {
  hasPurchase: boolean;
  isActive: boolean;
  purchase: {
    id: string;
    productId: string;
    status: 'active' | 'expired' | 'refunded';
    purchasedAt: string;
    expiresAt: string;
    daysRemaining: number;
    weeksRemaining: number;
  } | null;
}

export interface UsePurchaseReturn {
  // State
  status: PurchaseStatus | null;
  loading: boolean;
  error: string | null;
  package: PurchasesPackage | null;

  // Actions
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function usePurchase(): UsePurchaseReturn {
  const [status, setStatus] = useState<PurchaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);

  // Fetch purchase status from server (source of truth)
  const fetchStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setStatus({
          hasPurchase: false,
          isActive: false,
          purchase: null,
        });
        return;
      }

      // Get purchase from database
      const { data: purchase, error: dbError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .order('purchased_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbError) {
        console.error('Failed to fetch purchase status:', dbError);
        throw dbError;
      }

      if (!purchase) {
        setStatus({
          hasPurchase: false,
          isActive: false,
          purchase: null,
        });
        return;
      }

      const now = new Date();
      const expiresAt = new Date(purchase.expires_at);
      const isActive = purchase.status === 'active' && expiresAt > now;
      const daysRemaining = isActive
        ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      setStatus({
        hasPurchase: true,
        isActive,
        purchase: {
          id: purchase.id,
          productId: purchase.product_id,
          status: purchase.status,
          purchasedAt: purchase.purchased_at,
          expiresAt: purchase.expires_at,
          daysRemaining,
          weeksRemaining: Math.ceil(daysRemaining / 7),
        },
      });
    } catch (err: any) {
      console.error('Error fetching purchase status:', err);
      setError(err.message || 'Failed to fetch purchase status');
    }
  }, []);

  // Fetch available package
  const fetchPackage = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      const coachingPkg = await getCoachingPackage();
      setPkg(coachingPkg);
    } catch (err) {
      console.error('Error fetching package:', err);
      // Non-critical error, don't set error state
    }
  }, []);

  // Initialize
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchPackage()]);
      setLoading(false);
    };

    init();
  }, [fetchStatus, fetchPackage]);

  // Purchase action
  const purchase = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await purchaseCoachingPackage();

      // Wait a bit for webhook to process, then refresh status
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await fetchStatus();

      return true;
    } catch (err: any) {
      if (err.message === 'PURCHASE_CANCELLED') {
        // User cancelled, not an error
        return false;
      }

      console.error('Purchase error:', err);
      setError(err.message || 'Purchase failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  // Restore action
  const restore = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await restorePurchases();

      // Refresh status after restore
      await fetchStatus();

      return status?.isActive || false;
    } catch (err: any) {
      console.error('Restore error:', err);
      setError(err.message || 'Restore failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStatus, status]);

  // Refresh action
  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    await fetchStatus();
    setLoading(false);
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    package: pkg,
    purchase,
    restore,
    refresh,
  };
}
