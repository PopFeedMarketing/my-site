import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  // Verify the user has an active subscription
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription')
    .eq('id', userId)
    .single();

  if (!profile || profile.subscription === 'free') {
    return res.status(403).json({ error: 'Active subscription required' });
  }

  // Load the user's automation settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!settings) {
    return res.status(400).json({
      error: 'No settings found. Please configure your agent settings first.',
    });
  }

  if (!settings.platforms || settings.platforms.length === 0) {
    return res.status(400).json({
      error: 'No platforms selected. Add at least one platform in Agent Settings.',
    });
  }

  // Create a run log entry so the dashboard can track progress
  const { data: run, error: runError } = await supabase
    .from('automation_runs')
    .insert({ user_id: userId, status: 'running' })
    .select('id')
    .single();

  if (runError) {
    console.error('Failed to create run log:', runError.message);
    return res.status(500).json({ error: 'Failed to create run log' });
  }

  // Fire the n8n webhook — URL stays server-side, never exposed to the frontend
  try {
    const n8nRes = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        run_id: run.id,
        user_id: userId,
        platforms: settings.platforms,
        post_frequency: settings.post_frequency,
        tone: settings.tone,
        hashtags: settings.hashtags,
        auto_post: settings.auto_post,
        post_types: settings.post_types,
        preferred_times: settings.preferred_times,
        agent_name: settings.agent_name,
        business_name: settings.business_name,
        custom_prompt: settings.custom_prompt,
      }),
    });

    if (!n8nRes.ok) throw new Error(`n8n responded with ${n8nRes.status}`);

    return res.status(200).json({ ok: true, runId: run.id });
  } catch (error) {
    // Mark the run as failed so the dashboard shows the correct state
    await supabase
      .from('automation_runs')
      .update({ status: 'failed', error: error.message, completed_at: new Date().toISOString() })
      .eq('id', run.id);

    console.error('n8n trigger error:', error.message);
    return res.status(500).json({ error: 'Failed to reach the automation engine' });
  }
}
