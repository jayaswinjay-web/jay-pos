import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteMemberRequest {
  email: string;
  displayName: string;
  roleId: string;
  organizationId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const body: InviteMemberRequest = await req.json();
    const { email, displayName, roleId, organizationId } = body;

    if (!email || !displayName || !roleId || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Email too long (max 255 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (displayName.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Display name too long (max 200 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify permissions
    const { data: hasPermission, error: permError } = await supabaseClient
      .rpc('has_org_permission', { 
        _org_id: organizationId, 
        _permission: 'manage_users' 
      });

    if (permError || !hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Access denied: insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify role belongs to org
    const { data: roleData, error: roleError } = await supabaseClient
      .from('custom_roles')
      .select('id, organization_id, default_role_type')
      .eq('id', roleId)
      .eq('organization_id', organizationId)
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Invalid role or role does not belong to this organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (roleData.default_role_type === 'owner') {
      return new Response(
        JSON.stringify({ error: 'Cannot assign owner role to new members' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: 'Unable to verify current user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Use inviteUserByEmail - this sends an invitation email automatically
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        display_name: displayName,
        organization_id: organizationId,
        role_id: roleId,
        invited_by: currentUser.id,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      if (authError.message?.includes('already registered') || authError.message?.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'This email is already registered' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: authError.message || 'Failed to invite user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add as organization member
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: authData.user.id,
        role_id: roleId,
        display_name: displayName,
        email: email,
        is_active: true,
        invited_by: currentUser.id
      });

    if (memberError) {
      console.error('Member insert error:', memberError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to add member to organization' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully invited ${email} to organization ${organizationId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        userId: authData.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
