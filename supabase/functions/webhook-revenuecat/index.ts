// VowArk RevenueCat Webhook Handler
// Supabase Edge Function for processing purchase and refund events
// Based on Ticket 008 specification

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Stale processing detection helper
function isStaleProcessing(startedAt: string | null): boolean {
  if (!startedAt) return true;
  const started = new Date(startedAt).getTime();
  return Date.now() - started > PROCESSING_TIMEOUT_MS;
}

// Verify RevenueCat webhook signature
function verifyWebhookSignature(signature: string | null): boolean {
  const expectedSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!expectedSecret) {
    console.error('REVENUECAT_WEBHOOK_SECRET not configured');
    return false;
  }
  return signature === `Bearer ${expectedSecret}`;
}

serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify webhook signature
  const signature = req.headers.get('Authorization');
  if (!verifyWebhookSignature(signature)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Initialize Supabase client with service role key
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const event = await req.json();
    const transactionId = event.original_transaction_id;
    const eventType = event.type;
    const eventId = event.id;

    console.log(`Processing webhook event: ${eventType} (${eventId})`);

    // Idempotency check (event_id + event_type)
    const { data: existingEvent, error: selectError } = await supabase
      .from('webhook_events')
      .select('id, status, started_at')
      .eq('event_id', eventId)
      .eq('event_type', eventType)
      .maybeSingle();

    if (selectError) {
      console.error('Failed to check existing event:', selectError);
      return new Response('Database error', { status: 500 });
    }

    // Skip already completed events
    if (existingEvent?.status === 'completed') {
      return new Response('Event already processed', { status: 200 });
    }

    // Handle processing state with timeout detection
    if (existingEvent?.status === 'processing') {
      if (!isStaleProcessing(existingEvent.started_at)) {
        return new Response('Event is being processed', { status: 202 });
      }

      console.warn(`Stale processing detected for event ${eventId}, marking as timed out`);

      const { data: staleUpdateResult } = await supabase
        .from('webhook_events')
        .update({
          status: 'failed',
          error_message: `Processing timed out after ${PROCESSING_TIMEOUT_MS / 1000}s`,
        })
        .eq('id', existingEvent.id)
        .eq('status', 'processing')
        .eq('started_at', existingEvent.started_at)
        .select('id')
        .maybeSingle();

      if (staleUpdateResult) {
        existingEvent.status = 'failed';
      }
    }

    // Record or update event status
    let webhookEventId: string;
    const now = new Date().toISOString();

    if (existingEvent) {
      // Retry existing failed/stale event with optimistic locking
      webhookEventId = existingEvent.id;
      const { data: updateResult, error: updateError } = await supabase
        .from('webhook_events')
        .update({
          status: 'processing',
          error_message: null,
          started_at: now,
        })
        .eq('id', webhookEventId)
        .eq('status', existingEvent.status)
        .select('id')
        .maybeSingle();

      if (updateError) {
        console.error('Failed to update event:', updateError);
        return new Response('Database error', { status: 500 });
      }

      if (!updateResult) {
        return new Response('Event is being processed by another request', { status: 202 });
      }
    } else {
      // Insert new event (INSERT ON CONFLICT DO NOTHING)
      const { data: insertResult, error: insertError } = await supabase
        .from('webhook_events')
        .upsert(
          {
            event_id: eventId,
            event_type: eventType,
            transaction_id: transactionId,
            status: 'processing',
            started_at: now,
          },
          {
            onConflict: 'event_id,event_type',
            ignoreDuplicates: true,
          }
        )
        .select('id')
        .maybeSingle();

      if (insertError) {
        console.error('Failed to record event:', insertError);
        return new Response('Database error', { status: 500 });
      }

      // Handle race condition (another request inserted between SELECT and INSERT)
      if (!insertResult) {
        const { data: conflictedRow, error: conflictSelectError } = await supabase
          .from('webhook_events')
          .select('id, status, started_at')
          .eq('event_id', eventId)
          .eq('event_type', eventType)
          .maybeSingle();

        if (conflictSelectError) {
          console.error('Failed to fetch conflicted row:', conflictSelectError);
          return new Response('Database error', { status: 500 });
        }

        if (!conflictedRow) {
          return new Response('Conflict detected, please retry', { status: 409 });
        }

        if (conflictedRow.status === 'completed') {
          return new Response('Event already processed', { status: 200 });
        }

        if (conflictedRow.status === 'processing') {
          if (!isStaleProcessing(conflictedRow.started_at)) {
            return new Response('Event is being processed', { status: 202 });
          }
          await supabase
            .from('webhook_events')
            .update({
              status: 'failed',
              error_message: `Processing timed out after ${PROCESSING_TIMEOUT_MS / 1000}s (detected via insert conflict)`,
            })
            .eq('id', conflictedRow.id)
            .eq('status', 'processing');
          return new Response('Stale processing detected, please retry', { status: 409 });
        }

        return new Response('Previous attempt failed, please retry', { status: 409 });
      }

      webhookEventId = insertResult.id;
    }

    // Process the event
    try {
      switch (eventType) {
        case 'INITIAL_PURCHASE':
        case 'NON_RENEWING_PURCHASE':
          await handlePurchase(supabase, event);
          break;
        case 'REFUND':
          await handleRefund(supabase, event);
          break;
        default:
          console.log(`Unhandled event type: ${eventType}`);
      }

      // Mark as completed
      await supabase
        .from('webhook_events')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhookEventId);

      return new Response('OK', { status: 200 });
    } catch (error: any) {
      // Mark as failed (retryable)
      await supabase
        .from('webhook_events')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error',
        })
        .eq('id', webhookEventId);

      console.error('Webhook processing failed:', error);
      return new Response('Processing failed', { status: 500 });
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

// Handle purchase event
async function handlePurchase(supabase: any, event: any) {
  const purchasedAt = new Date(event.purchase_date);
  const expiresAt = new Date(purchasedAt);
  expiresAt.setDate(expiresAt.getDate() + 63); // 9 weeks

  // Get user by RevenueCat app_user_id (should be Supabase user ID)
  const userId = event.app_user_id;

  // Check if purchase already exists (idempotent)
  const { data: existingPurchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('revenuecat_transaction_id', event.original_transaction_id)
    .maybeSingle();

  if (existingPurchase) {
    console.log(`Purchase already exists: ${event.original_transaction_id}`);
    return;
  }

  // Insert purchase record
  const { error: insertError } = await supabase.from('purchases').insert({
    user_id: userId,
    revenuecat_app_user_id: event.app_user_id,
    revenuecat_transaction_id: event.original_transaction_id,
    product_id: event.product_id,
    store: event.store === 'APP_STORE' ? 'app_store' : 'play_store',
    status: 'active',
    price_paid: event.price ? Math.round(event.price * 100) : 19800, // Convert to cents/yen
    currency: event.currency || 'JPY',
    purchased_at: purchasedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    console.error('Failed to insert purchase:', insertError);
    throw insertError;
  }

  // Update user phase to paid
  const { error: updateError } = await supabase
    .from('users')
    .update({
      current_phase: 'paid',
      purchase_expires_at: expiresAt.toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to update user phase:', updateError);
    throw updateError;
  }

  console.log(`Purchase processed: ${event.original_transaction_id} for user ${userId}`);
}

// Handle refund event
async function handleRefund(supabase: any, event: any) {
  const transactionId = event.original_transaction_id;

  // Get the purchase
  const { data: purchase, error: selectError } = await supabase
    .from('purchases')
    .select('*')
    .eq('revenuecat_transaction_id', transactionId)
    .single();

  if (selectError || !purchase) {
    console.error('Purchase not found for refund:', transactionId);
    throw new Error(`Purchase not found: ${transactionId}`);
  }

  // Update purchase status to refunded
  const { error: updatePurchaseError } = await supabase
    .from('purchases')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('id', purchase.id);

  if (updatePurchaseError) {
    console.error('Failed to update purchase status:', updatePurchaseError);
    throw updatePurchaseError;
  }

  // Update user phase back to trial
  const { error: updateUserError } = await supabase
    .from('users')
    .update({
      current_phase: 'trial',
      purchase_expires_at: null,
    })
    .eq('id', purchase.user_id);

  if (updateUserError) {
    console.error('Failed to update user phase:', updateUserError);
    throw updateUserError;
  }

  // Create exit review record for refund
  await supabase.from('exit_reviews').insert({
    user_id: purchase.user_id,
    purchase_id: purchase.id,
    exit_type: 'refund',
  });

  console.log(`Refund processed: ${transactionId} for user ${purchase.user_id}`);
}
