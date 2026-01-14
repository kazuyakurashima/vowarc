// VowArk Purchase Expiry Check
// Supabase Edge Function for processing expired purchases (called by cron)
// Based on Ticket 008 specification

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  // Only accept POST requests (for cron jobs)
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify cron secret (optional security)
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  if (expectedSecret && cronSecret !== expectedSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Initialize Supabase client with service role key
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const now = new Date();
    console.log(`Running expiry check at ${now.toISOString()}`);

    // Find expired purchases
    const { data: expiredPurchases, error: selectError } = await supabase
      .from('purchases')
      .select('id, user_id, expires_at')
      .eq('status', 'active')
      .lt('expires_at', now.toISOString());

    if (selectError) {
      console.error('Failed to fetch expired purchases:', selectError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: selectError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!expiredPurchases || expiredPurchases.length === 0) {
      console.log('No expired purchases found');
      return new Response(
        JSON.stringify({ message: 'No expired purchases', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredPurchases.length} expired purchases`);

    let processedCount = 0;
    let errorCount = 0;

    for (const purchase of expiredPurchases) {
      try {
        // Update purchase status to expired
        const { error: updatePurchaseError } = await supabase
          .from('purchases')
          .update({
            status: 'expired',
            updated_at: now.toISOString(),
          })
          .eq('id', purchase.id)
          .eq('status', 'active'); // Optimistic lock

        if (updatePurchaseError) {
          console.error(`Failed to update purchase ${purchase.id}:`, updatePurchaseError);
          errorCount++;
          continue;
        }

        // Check if user has any other active purchases before marking as completed
        const { data: otherActivePurchases } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', purchase.user_id)
          .eq('status', 'active')
          .gt('expires_at', now.toISOString())
          .limit(1);

        // Only update user phase if no other active purchases exist
        if (!otherActivePurchases || otherActivePurchases.length === 0) {
          const { error: updateUserError } = await supabase
            .from('users')
            .update({
              current_phase: 'completed',
              purchase_expires_at: null,
            })
            .eq('id', purchase.user_id)
            .eq('current_phase', 'paid'); // Only if still paid

          if (updateUserError) {
            console.error(`Failed to update user ${purchase.user_id}:`, updateUserError);
            // Don't count as error - purchase was updated
          }

          // Create graduation exit review record only if actually graduating
          await supabase.from('exit_reviews').insert({
            user_id: purchase.user_id,
            purchase_id: purchase.id,
            exit_type: 'graduation',
          });
        } else {
          console.log(`User ${purchase.user_id} has other active purchases, skipping phase update`);
        }

        processedCount++;
        console.log(`Processed expiry for purchase ${purchase.id}, user ${purchase.user_id}`);

        // TODO: Send graduation notification (push notification)
        // This would be integrated with a notification service

      } catch (error) {
        console.error(`Error processing purchase ${purchase.id}:`, error);
        errorCount++;
      }
    }

    const response = {
      message: 'Expiry check completed',
      total: expiredPurchases.length,
      processed: processedCount,
      errors: errorCount,
      timestamp: now.toISOString(),
    };

    console.log('Expiry check result:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Check expiry error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
