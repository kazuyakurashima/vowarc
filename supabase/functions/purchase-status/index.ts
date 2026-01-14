// VowArc Purchase Status API
// Supabase Edge Function for checking user's purchase status

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept GET requests
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Get auth header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's active purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('purchased_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (purchaseError) {
      console.error('Failed to fetch purchase:', purchaseError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate status
    const now = new Date();
    const isActive = purchase
      ? purchase.status === 'active' && new Date(purchase.expires_at) > now
      : false;

    const daysRemaining = purchase && isActive
      ? Math.ceil((new Date(purchase.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const weeksRemaining = Math.ceil(daysRemaining / 7);

    const response = {
      hasPurchase: !!purchase,
      isActive,
      purchase: purchase ? {
        id: purchase.id,
        productId: purchase.product_id,
        status: purchase.status,
        purchasedAt: purchase.purchased_at,
        expiresAt: purchase.expires_at,
        daysRemaining,
        weeksRemaining,
      } : null,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Purchase status error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
