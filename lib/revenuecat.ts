/**
 * VowArk RevenueCat Configuration
 *
 * Initializes RevenueCat SDK for in-app purchases
 * Based on Ticket 008 specification (Non-Renewing Subscription)
 */

import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
} from 'react-native-purchases';

// RevenueCat API Keys (from environment variables)
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Product ID
export const PRODUCT_ID = 'vowark_coaching_9weeks';

// Entitlement ID
export const ENTITLEMENT_ID = 'pro_access';

// Package duration in days
export const PACKAGE_DURATION_DAYS = 63; // 9 weeks

/**
 * Initialize RevenueCat SDK
 * Should be called once at app startup
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  // Skip initialization on web
  if (Platform.OS === 'web') {
    console.log('RevenueCat: Skipping initialization on web');
    return;
  }

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

  if (!apiKey) {
    console.warn('RevenueCat: API key not configured for', Platform.OS);
    return;
  }

  try {
    // Set log level for debugging (reduce in production)
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat
    await Purchases.configure({
      apiKey,
      appUserID: userId, // Use Supabase user ID for attribution
    });

    console.log('RevenueCat: Initialized successfully');
  } catch (error) {
    console.error('RevenueCat: Initialization failed', error);
    throw error;
  }
}

/**
 * Set or update the user ID for RevenueCat
 * Call this after user authentication
 */
export async function setRevenueCatUserId(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Purchases.logIn(userId);
    console.log('RevenueCat: User ID set', userId);
  } catch (error) {
    console.error('RevenueCat: Failed to set user ID', error);
    throw error;
  }
}

/**
 * Log out user from RevenueCat
 * Call this when user signs out
 */
export async function logOutRevenueCat(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Purchases.logOut();
    console.log('RevenueCat: User logged out');
  } catch (error) {
    console.error('RevenueCat: Failed to log out', error);
    throw error;
  }
}

/**
 * Get available packages for purchase
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      console.warn('RevenueCat: No current offering found');
      return [];
    }

    return offerings.current.availablePackages;
  } catch (error) {
    console.error('RevenueCat: Failed to get offerings', error);
    throw error;
  }
}

/**
 * Get the 9-week coaching package
 */
export async function getCoachingPackage(): Promise<PurchasesPackage | null> {
  const packages = await getOfferings();
  return packages.find((pkg) => pkg.product.identifier === PRODUCT_ID) || null;
}

/**
 * Purchase the 9-week coaching package
 */
export async function purchaseCoachingPackage(): Promise<{
  customerInfo: CustomerInfo;
  productId: string;
}> {
  if (Platform.OS === 'web') {
    throw new Error('Purchases not supported on web');
  }

  try {
    const pkg = await getCoachingPackage();

    if (!pkg) {
      throw new Error('Coaching package not found');
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);

    return {
      customerInfo,
      productId: PRODUCT_ID,
    };
  } catch (error) {
    const purchaseError = error as PurchasesError;

    // Handle user cancellation
    if (purchaseError.userCancelled) {
      throw new Error('PURCHASE_CANCELLED');
    }

    console.error('RevenueCat: Purchase failed', error);
    throw error;
  }
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('RevenueCat: Failed to get customer info', error);
    throw error;
  }
}

/**
 * Check if user has active entitlement
 * Note: For Non-Renewing Subscription, we primarily use server-side check
 * This is a fallback for offline scenarios
 */
export async function hasActiveEntitlement(): Promise<boolean> {
  const customerInfo = await getCustomerInfo();

  if (!customerInfo) {
    return false;
  }

  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  return !!entitlement;
}

/**
 * Restore purchases
 * Useful when user reinstalls or switches devices
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  if (Platform.OS === 'web') {
    throw new Error('Restore not supported on web');
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('RevenueCat: Purchases restored');
    return customerInfo;
  } catch (error) {
    console.error('RevenueCat: Restore failed', error);
    throw error;
  }
}

// Re-export types for convenience
export type { CustomerInfo, PurchasesPackage, PurchasesError };
