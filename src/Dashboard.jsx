import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/*
 * ============================================
 *  POPFEED DASHBOARD
 * ============================================
 *
 *  PAGES:
 *  - "overview"   → Quick stats + recent activity
 *  - "accounts"   → Link/unlink social media accounts
 *  - "analytics"  → Charts, graphs, performance data
 *  - "posts"      → View generated/posted content
 *  - "settings"   → Agent preferences, posting frequency, etc.
 *
 *  SECURITY:
 *  - Only accessible with an active subscription
 *  - All data scoped to the logged-in user
 *
 * ============================================
 */

// ════════════════════════════════════════════
//  DASHBOARD WRAPPER (handles auth + sidebar)
// ════════════════════════════════════════════
export default function Dashboard({ user, setPage }) {
  const [dashPage, setDashPage] = useState("overview");

  // Security: redirect if no subscription
  if (!user || !user.subscription || user.subscription === "free") {
    return (
      <div className="page auth-page">
        <div className="glass-card auth-card" style={{ textAlign: "center" }}>
          <h2 className="auth-title">Subscription Required</h2>
          <p className="auth-subtitle">
            You need an active subscription to access the dashboard.
          </p>
          <button
            className="btn-primary btn-full"
            onClick={() => setPage("pricing")}
          >
            Choose a Plan
          </button>
        </div>
      </div>
    );
  }

  const renderDashPage = () => {
    switch (dashPage) {
      case "overview":
        return <DashOverview user={user} setDashPage={setDashPage} />;
      case "accounts":
        return <DashAccounts user={user} />;
      case "analytics":
        return <DashAnalytics user={user} />;
      case "posts":
        return <DashPosts user={user} />;
      case "settings":
        return <DashSettings user={user} />;
      case "posting":
        return <DashPosting user={user} setDashPage={setDashPage} />;
      default:
        return <DashOverview user={user} setDashPage={setDashPage} />;
    }
  };

  return (
    <div className="page dashboard-page">
      <div className="dash-layout">
        {/* ── Sidebar ── */}
        <aside className="dash-sidebar">
          <div className="dash-sidebar-header">
            <span className="dash-avatar">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
            <div className="dash-user-info">
              <span className="dash-user-name">{user.name}</span>
              <span className="dash-user-plan">{user.subscription}</span>
            </div>
          </div>

          <nav className="dash-nav">
            <button
              className={`dash-nav-btn ${dashPage === "overview" ? "active" : ""}`}
              onClick={() => setDashPage("overview")}
            >
              <span className="dash-nav-icon">📊</span>
              Overview
            </button>
            <button
              className={`dash-nav-btn dash-nav-btn-create ${dashPage === "posting" ? "active" : ""}`}
              onClick={() => setDashPage("posting")}
            >
              <span className="dash-nav-icon">🚀</span>
              Create Post
            </button>
            <button
              className={`dash-nav-btn ${dashPage === "accounts" ? "active" : ""}`}
              onClick={() => setDashPage("accounts")}
            >
              <span className="dash-nav-icon">🔗</span>
              Accounts
            </button>
            <button
              className={`dash-nav-btn ${dashPage === "analytics" ? "active" : ""}`}
              onClick={() => setDashPage("analytics")}
            >
              <span className="dash-nav-icon">📈</span>
              Analytics
            </button>
            <button
              className={`dash-nav-btn ${dashPage === "posts" ? "active" : ""}`}
              onClick={() => setDashPage("posts")}
            >
              <span className="dash-nav-icon">📝</span>
              Posts
            </button>
            <button
              className={`dash-nav-btn ${dashPage === "settings" ? "active" : ""}`}
              onClick={() => setDashPage("settings")}
            >
              <span className="dash-nav-icon">⚙️</span>
              Settings
            </button>
          </nav>

          <button className="dash-nav-btn dash-back-btn" onClick={() => setPage("home")}>
            <span className="dash-nav-icon">←</span>
            Back to Site
          </button>
        </aside>

        {/* ── Main Content ── */}
        <main className="dash-main">{renderDashPage()}</main>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  OVERVIEW PAGE
// ════════════════════════════════════════════
function DashOverview({ user, setDashPage }) {
  const [running, setRunning] = useState(false);
  const [runStatus, setRunStatus] = useState(null); // null | 'success' | 'error'
  const [runError, setRunError] = useState("");

  const quickStats = [
    { label: "Total Views", value: "0", icon: "👁️", color: "#ff6b9d" },
    { label: "Total Likes", value: "0", icon: "❤️", color: "#b388ff" },
    { label: "Posts Created", value: "0", icon: "📝", color: "#7ec8e3" },
    { label: "Accounts Linked", value: "0", icon: "🔗", color: "#ff6b9d" },
  ];

  const handleRunAutomation = async () => {
    setRunning(true);
    setRunStatus(null);
    setRunError("");
    try {
      const response = await fetch('/api/trigger-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Automation failed');
      setRunStatus('success');
    } catch (err) {
      setRunStatus('error');
      setRunError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="dash-content">
      <div className="dash-header">
        <h1 className="dash-title">Welcome back, {user.name}</h1>
        <p className="dash-subtitle">Here's what's happening with your accounts.</p>
      </div>

      {/* Quick Stats */}
      <div className="dash-stats-grid">
        {quickStats.map((stat, i) => (
          <div key={i} className="glass-card dash-stat-card">
            <div className="dash-stat-icon" style={{ background: `${stat.color}20` }}>
              <span>{stat.icon}</span>
            </div>
            <div className="dash-stat-info">
              <span className="dash-stat-value" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="dash-stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="dash-header" style={{ marginTop: "2rem" }}>
        <h2 className="dash-section-title">Quick Actions</h2>
      </div>
      <div className="dash-actions-grid">
        <button className="glass-card dash-action-card" onClick={() => setDashPage("accounts")}>
          <span className="dash-action-icon">🔗</span>
          <span className="dash-action-label">Link an Account</span>
          <span className="dash-action-desc">Connect your social media platforms</span>
        </button>
        <button className="glass-card dash-action-card" onClick={() => setDashPage("posts")}>
          <span className="dash-action-icon">📝</span>
          <span className="dash-action-label">View Posts</span>
          <span className="dash-action-desc">See your generated content</span>
        </button>
        <button className="glass-card dash-action-card" onClick={() => setDashPage("analytics")}>
          <span className="dash-action-icon">📈</span>
          <span className="dash-action-label">View Analytics</span>
          <span className="dash-action-desc">Check your performance metrics</span>
        </button>
        <button className="glass-card dash-action-card" onClick={() => setDashPage("settings")}>
          <span className="dash-action-icon">⚙️</span>
          <span className="dash-action-label">Agent Settings</span>
          <span className="dash-action-desc">Configure your posting preferences</span>
        </button>
      </div>

      {/* Run Automation */}
      <div className="dash-header" style={{ marginTop: "2.5rem" }}>
        <h2 className="dash-section-title">Automation</h2>
      </div>
      <div className="glass-card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Run Your Automation Now</p>
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>
            Triggers n8n to generate and schedule posts based on your settings.
          </p>
          {runStatus === 'success' && (
            <p style={{ color: "#7ec8e3", marginTop: "0.5rem", fontSize: "0.875rem" }}>
              ✓ Automation started! Check the Posts tab for results.
            </p>
          )}
          {runStatus === 'error' && (
            <p style={{ color: "#ff6b6b", marginTop: "0.5rem", fontSize: "0.875rem" }}>
              {runError}
            </p>
          )}
        </div>
        <button
          className="btn-primary"
          onClick={handleRunAutomation}
          disabled={running}
          style={{ whiteSpace: "nowrap" }}
        >
          {running ? "Running..." : "▶ Run Now"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  ACCOUNTS PAGE — Link/Unlink Social Media
// ════════════════════════════════════════════
function DashAccounts({ user }) {
  /*
   * EDIT: Each platform has:
   *  - name: display name
   *  - icon: emoji
   *  - color: brand-ish color
   *  - connected: true/false
   *  - handle: the username once connected
   *
   * Once n8n is integrated, connected status and handles
   * will be pulled from Supabase.
   */
  const [platforms, setPlatforms] = useState([
    { id: "instagram", name: "Instagram", logo: "https://cdn.simpleicons.org/instagram/E1306C", color: "#E1306C", connected: false, handle: "" },
    { id: "facebook", name: "Facebook", logo: "https://cdn.simpleicons.org/facebook/1877F2", color: "#1877F2", connected: false, handle: "" },
    { id: "tiktok", name: "TikTok", logo: "https://cdn.simpleicons.org/tiktok/ffffff", color: "#00f2ea", connected: false, handle: "" },
    { id: "linkedin", name: "LinkedIn", logo: "https://cdn.simpleicons.org/linkedin/0A66C2", color: "#0A66C2", connected: false, handle: "" },
    { id: "x", name: "X (Twitter)", logo: "https://cdn.simpleicons.org/x/ffffff", color: "#e2e2e2", connected: false, handle: "" },
  ]);

  const handleConnect = (platformId) => {
    /*
     * EDIT: Replace this with your n8n webhook call to start OAuth flow.
     * Example:
     * fetch("https://your-n8n.app.n8n.cloud/webhook/connect-platform", {
     *   method: "POST",
     *   headers: { "Content-Type": "application/json" },
     *   body: JSON.stringify({ userId: user.id, platform: platformId })
     * }).then(res => res.json()).then(data => {
     *   window.location.href = data.authUrl;
     * });
     */
    // Placeholder: toggle connected state
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === platformId
          ? { ...p, connected: !p.connected, handle: p.connected ? "" : "@popfeed_demo" }
          : p
      )
    );
  };

  const connectedCount = platforms.filter((p) => p.connected).length;

  return (
    <div className="dash-content">
      <div className="dash-header">
        <h1 className="dash-title">Connected Accounts</h1>
        <p className="dash-subtitle">
          {connectedCount} of {platforms.length} platforms connected
        </p>
      </div>

      <div className="accounts-grid">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`glass-card account-platform-card ${platform.connected ? "connected" : ""}`}
          >
            <div className="platform-header">
              <div className="platform-icon-wrap" style={{ background: `${platform.color}20` }}>
                <img src={platform.logo} alt={platform.name} className="platform-icon-img" />
              </div>
              <div className="platform-info">
                <h3 className="platform-name">{platform.name}</h3>
                {platform.connected ? (
                  <span className="platform-handle" style={{ color: platform.color }}>
                    {platform.handle}
                  </span>
                ) : (
                  <span className="platform-status">Not connected</span>
                )}
              </div>
            </div>
            <div className="platform-footer">
              {platform.connected && (
                <div className="platform-connected-badge">
                  <span className="connected-dot" style={{ background: platform.color }}></span>
                  Connected
                </div>
              )}
              <button
                className={`btn-platform ${platform.connected ? "btn-disconnect" : ""}`}
                style={
                  platform.connected
                    ? {}
                    : { background: platform.color, color: "#fff" }
                }
                onClick={() => handleConnect(platform.id)}
              >
                {platform.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  ANALYTICS PAGE — Charts & Performance
// ════════════════════════════════════════════
function DashAnalytics({ user }) {
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");

  /*
   * EDIT: This is placeholder data.
   * Once n8n is integrated, this data will come from Supabase
   * populated by your n8n analytics workflows.
   */
  const sampleData = {
    "7d": [
      { date: "Mon", views: 120, likes: 45, impressions: 340 },
      { date: "Tue", views: 185, likes: 62, impressions: 520 },
      { date: "Wed", views: 210, likes: 78, impressions: 610 },
      { date: "Thu", views: 165, likes: 55, impressions: 480 },
      { date: "Fri", views: 290, likes: 98, impressions: 780 },
      { date: "Sat", views: 340, likes: 125, impressions: 920 },
      { date: "Sun", views: 280, likes: 110, impressions: 850 },
    ],
    "30d": [
      { date: "Week 1", views: 890, likes: 320, impressions: 2400 },
      { date: "Week 2", views: 1250, likes: 485, impressions: 3600 },
      { date: "Week 3", views: 1580, likes: 610, impressions: 4200 },
      { date: "Week 4", views: 1820, likes: 720, impressions: 5100 },
    ],
    "90d": [
      { date: "Month 1", views: 4200, likes: 1600, impressions: 12000 },
      { date: "Month 2", views: 6800, likes: 2400, impressions: 18500 },
      { date: "Month 3", views: 9200, likes: 3500, impressions: 26000 },
    ],
  };

  const chartData = sampleData[timeRange] || sampleData["7d"];

  const totalViews = chartData.reduce((sum, d) => sum + d.views, 0);
  const totalLikes = chartData.reduce((sum, d) => sum + d.likes, 0);
  const totalImpressions = chartData.reduce((sum, d) => sum + d.impressions, 0);

  const platformOptions = [
    { id: "all", label: "All Platforms" },
    { id: "instagram", label: "Instagram" },
    { id: "facebook", label: "Facebook" },
    { id: "tiktok", label: "TikTok" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "x", label: "X (Twitter)" },
  ];

  return (
    <div className="dash-content">
      <div className="dash-header">
        <h1 className="dash-title">Analytics</h1>
        <p className="dash-subtitle">Track your performance across all platforms.</p>
      </div>

      {/* Filters */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label className="filter-label">Platform</label>
          <select
            className="filter-select"
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
          >
            {platformOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Time Range</label>
          <div className="filter-tabs">
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`filter-tab ${timeRange === tab.id ? "active" : ""}`}
                onClick={() => setTimeRange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="analytics-summary">
        <div className="glass-card analytics-stat">
          <span className="analytics-stat-label">Total Views</span>
          <span className="analytics-stat-value" style={{ color: "#ff6b9d" }}>
            {totalViews.toLocaleString()}
          </span>
        </div>
        <div className="glass-card analytics-stat">
          <span className="analytics-stat-label">Total Likes</span>
          <span className="analytics-stat-value" style={{ color: "#b388ff" }}>
            {totalLikes.toLocaleString()}
          </span>
        </div>
        <div className="glass-card analytics-stat">
          <span className="analytics-stat-label">Total Impressions</span>
          <span className="analytics-stat-value" style={{ color: "#7ec8e3" }}>
            {totalImpressions.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card analytics-chart-card">
        <h3 className="chart-title">Performance Over Time</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "8px",
                  color: "#e8e8e8",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#ff6b9d"
                strokeWidth={2}
                dot={{ fill: "#ff6b9d", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="likes"
                stroke="#b388ff"
                strokeWidth={2}
                dot={{ fill: "#b388ff", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke="#7ec8e3"
                strokeWidth={2}
                dot={{ fill: "#7ec8e3", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  POSTS PAGE — View Generated Content
// ════════════════════════════════════════════
function DashPosts({ user }) {
  const [filter, setFilter] = useState("all");

  /*
   * EDIT: This is placeholder data.
   * Once n8n is integrated, posts will be stored in Supabase
   * and loaded here.
   */
  const [posts] = useState([
    {
      id: 1,
      platform: "Instagram",
      logo: "https://cdn.simpleicons.org/instagram/E1306C",
      status: "posted",
      date: "2025-03-10",
      time: "10:30 AM",
      caption:
        "✨ Just Listed! Stunning 4-bed home in Westlake with an open floor plan and heated pool. Schedule your showing today! 🏡 #JustListed #DreamHome",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
      engagement: { views: 342, likes: 89, comments: 12 },
    },
    {
      id: 2,
      platform: "Facebook",
      logo: "https://cdn.simpleicons.org/facebook/1877F2",
      status: "posted",
      date: "2025-03-09",
      time: "2:15 PM",
      caption:
        "🏠 PRICE REDUCED — $450,000! Beautifully renovated 3-bed ranch in Maple Ridge. New roof, updated HVAC, fully finished basement. Don't miss this one!",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
      engagement: { views: 1240, likes: 156, comments: 28 },
    },
    {
      id: 3,
      platform: "LinkedIn",
      logo: "https://cdn.simpleicons.org/linkedin/0A66C2",
      status: "scheduled",
      date: "2025-03-12",
      time: "9:00 AM",
      caption:
        "My team closed 14 deals last quarter — and I didn't write a single social media post manually. Here's the truth about real estate marketing automation...",
      image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=400&h=300&fit=crop",
      engagement: null,
    },
    {
      id: 4,
      platform: "TikTok",
      logo: "https://cdn.simpleicons.org/tiktok/000000",
      status: "draft",
      date: "2025-03-12",
      time: "",
      caption:
        "POV: You just listed a $1.2M lakefront property and PopFeed made the content in 30 seconds 🎬 #RealTok #LuxuryRealEstate",
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
      engagement: null,
    },
  ]);

  const filteredPosts =
    filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const statusColors = {
    posted: "#4ade80",
    scheduled: "#b388ff",
    draft: "#888",
  };

  return (
    <div className="dash-content">
      <div className="dash-header">
        <h1 className="dash-title">Your Posts</h1>
        <p className="dash-subtitle">View and manage your generated content.</p>
      </div>

      {/* Filter Tabs */}
      <div className="posts-filters">
        {[
          { id: "all", label: "All Posts" },
          { id: "posted", label: "Posted" },
          { id: "scheduled", label: "Scheduled" },
          { id: "draft", label: "Drafts" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`filter-tab ${filter === tab.id ? "active" : ""}`}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
            <span className="filter-count">
              {tab.id === "all"
                ? posts.length
                : posts.filter((p) => p.status === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="posts-list">
        {filteredPosts.map((post) => (
          <div key={post.id} className="glass-card post-card">
            <div className="post-image-wrap">
              <img src={post.image} alt="" className="post-image" />
            </div>
            <div className="post-content">
              <div className="post-meta">
                <span className="post-platform">
                  <img src={post.logo} alt={post.platform} className="post-platform-icon" />
                  {post.platform}
                </span>
                <span
                  className="post-status"
                  style={{
                    color: statusColors[post.status],
                    borderColor: `${statusColors[post.status]}40`,
                  }}
                >
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </span>
              </div>
              <p className="post-caption">{post.caption}</p>
              <div className="post-footer">
                <span className="post-date">
                  {post.date} {post.time && `at ${post.time}`}
                </span>
                {post.engagement && (
                  <div className="post-engagement">
                    <span>👁️ {post.engagement.views}</span>
                    <span>❤️ {post.engagement.likes}</span>
                    <span>💬 {post.engagement.comments}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="glass-card empty-state">
            <p>No posts found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  SETTINGS PAGE — Agent Preferences
// ════════════════════════════════════════════
function DashSettings({ user }) {
  const defaultPostTypes = {
    listings: true,
    marketUpdates: true,
    tips: true,
    testimonials: false,
    behindTheScenes: false,
  };

  const [settings, setSettings] = useState({
    agentName: user.name || "",
    businessName: "",
    postFrequency: "daily",
    postTypes: defaultPostTypes,
    preferredTimes: "morning",
    tone: "professional",
    hashtags: true,
    autoPost: false,
    platforms: [],
    customPrompt: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Load existing settings from Supabase on mount
  useEffect(() => {
    supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setSettings({
            agentName: data.agent_name || user.name || "",
            businessName: data.business_name || "",
            postFrequency: data.post_frequency || "daily",
            postTypes: data.post_types || defaultPostTypes,
            preferredTimes: data.preferred_times || "morning",
            tone: data.tone || "professional",
            hashtags: data.hashtags ?? true,
            autoPost: data.auto_post ?? false,
            platforms: data.platforms || [],
            customPrompt: data.custom_prompt || "",
          });
        }
        // PGRST116 = no row found (first time user) — not a real error
        if (error && error.code !== 'PGRST116') {
          console.error('Failed to load settings:', error.message);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        agent_name: settings.agentName,
        business_name: settings.businessName,
        post_frequency: settings.postFrequency,
        post_types: settings.postTypes,
        preferred_times: settings.preferredTimes,
        tone: settings.tone,
        hashtags: settings.hashtags,
        auto_post: settings.autoPost,
        platforms: settings.platforms,
        custom_prompt: settings.customPrompt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      setSaveError("Failed to save settings. Please try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const togglePlatform = (platform) => {
    setSettings((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const updatePostType = (key) => {
    setSettings((prev) => ({
      ...prev,
      postTypes: { ...prev.postTypes, [key]: !prev.postTypes[key] },
    }));
  };

  if (loading) {
    return (
      <div className="dash-content">
        <div className="dash-header">
          <h1 className="dash-title">Agent Settings</h1>
          <p className="dash-subtitle">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-content">
      <div className="dash-header">
        <h1 className="dash-title">Agent Settings</h1>
        <p className="dash-subtitle">Configure how PopFeed creates and posts content for you.</p>
      </div>

      <div className="settings-grid">
        {/* Profile Settings */}
        <div className="glass-card settings-card">
          <h3 className="settings-card-title">Profile</h3>
          <div className="input-group">
            <label className="input-label">Agent / Display Name</label>
            <input
              type="text"
              className="input-field"
              value={settings.agentName}
              onChange={(e) => setSettings({ ...settings, agentName: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Business / Brokerage Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Keller Williams, RE/MAX"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
            />
          </div>
        </div>

        {/* Posting Frequency */}
        <div className="glass-card settings-card">
          <h3 className="settings-card-title">Posting Frequency</h3>
          <div className="settings-options">
            {[
              { id: "daily", label: "Daily", desc: "1 post per day" },
              { id: "every_other", label: "Every Other Day", desc: "3-4 posts per week" },
              { id: "weekly", label: "Weekly", desc: "1 post per week" },
              { id: "custom", label: "Custom", desc: "Set your own schedule" },
            ].map((opt) => (
              <button
                key={opt.id}
                className={`settings-option ${settings.postFrequency === opt.id ? "active" : ""}`}
                onClick={() => setSettings({ ...settings, postFrequency: opt.id })}
              >
                <span className="option-label">{opt.label}</span>
                <span className="option-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Post Types */}
        <div className="glass-card settings-card">
          <h3 className="settings-card-title">Content Types</h3>
          <p className="settings-card-desc">Choose what kinds of posts PopFeed generates for you.</p>
          <div className="settings-toggles">
            {[
              { key: "listings", label: "New Listings", desc: "Auto-generate posts when you add a listing" },
              { key: "marketUpdates", label: "Market Updates", desc: "Local market stats and trends" },
              { key: "tips", label: "Tips & Advice", desc: "Home buying/selling tips for your audience" },
              { key: "testimonials", label: "Testimonials", desc: "Client success stories and reviews" },
              { key: "behindTheScenes", label: "Behind the Scenes", desc: "Day-in-the-life content" },
            ].map((type) => (
              <div key={type.key} className="settings-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">{type.label}</span>
                  <span className="toggle-desc">{type.desc}</span>
                </div>
                <button
                  className={`toggle-switch ${settings.postTypes[type.key] ? "on" : ""}`}
                  onClick={() => updatePostType(type.key)}
                >
                  <span className="toggle-knob"></span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Time */}
        <div className="glass-card settings-card">
          <h3 className="settings-card-title">Preferred Posting Time</h3>
          <div className="settings-options">
            {[
              { id: "morning", label: "Morning", desc: "8 AM – 11 AM" },
              { id: "afternoon", label: "Afternoon", desc: "12 PM – 3 PM" },
              { id: "evening", label: "Evening", desc: "5 PM – 8 PM" },
              { id: "optimal", label: "AI Optimal", desc: "Let PopFeed decide" },
            ].map((opt) => (
              <button
                key={opt.id}
                className={`settings-option ${settings.preferredTimes === opt.id ? "active" : ""}`}
                onClick={() => setSettings({ ...settings, preferredTimes: opt.id })}
              >
                <span className="option-label">{opt.label}</span>
                <span className="option-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div className="glass-card settings-card">
          <h3 className="settings-card-title">Content Tone</h3>
          <div className="settings-options">
            {[
              { id: "professional", label: "Professional", desc: "Clean and polished" },
              { id: "casual", label: "Casual", desc: "Friendly and approachable" },
              { id: "luxury", label: "Luxury", desc: "High-end and aspirational" },
              { id: "energetic", label: "Energetic", desc: "Upbeat and exciting" },
            ].map((opt) => (
              <button
                key={opt.id}
                className={`settings-option ${settings.tone === opt.id ? "active" : ""}`}
                onClick={() => setSettings({ ...settings, tone: opt.id })}
              >
                <span className="option-label">{opt.label}</span>
                <span className="option-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="glass-card settings-card">
          <h3 className="settings-card-title">Additional Options</h3>
          <div className="settings-toggles">
            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-label">Auto-include Hashtags</span>
                <span className="toggle-desc">Automatically add relevant hashtags to posts</span>
              </div>
              <button
                className={`toggle-switch ${settings.hashtags ? "on" : ""}`}
                onClick={() => setSettings({ ...settings, hashtags: !settings.hashtags })}
              >
                <span className="toggle-knob"></span>
              </button>
            </div>
            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-label">Auto-Post</span>
                <span className="toggle-desc">Automatically post without manual approval</span>
              </div>
              <button
                className={`toggle-switch ${settings.autoPost ? "on" : ""}`}
                onClick={() => setSettings({ ...settings, autoPost: !settings.autoPost })}
              >
                <span className="toggle-knob"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Platforms */}
        <div className="glass-card settings-card">
          <h3 className="settings-card-title">Target Platforms</h3>
          <p className="settings-card-desc">Which platforms should PopFeed post to?</p>
          <div className="settings-toggles">
            {["Instagram", "TikTok", "X", "Facebook", "LinkedIn"].map((platform) => {
              const key = platform.toLowerCase();
              return (
                <div key={key} className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-label">{platform}</span>
                  </div>
                  <button
                    className={`toggle-switch ${settings.platforms.includes(key) ? "on" : ""}`}
                    onClick={() => togglePlatform(key)}
                  >
                    <span className="toggle-knob"></span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="glass-card settings-card">
          <h3 className="settings-card-title">Niche & Brand Description</h3>
          <p className="settings-card-desc">
            Tell the AI about your business in your own words. This is the core prompt n8n uses to generate content.
          </p>
          <div className="input-group">
            <textarea
              className="input-field textarea"
              rows={4}
              placeholder="e.g. I'm a luxury real estate agent in Austin, TX specializing in lakefront properties. My audience is high-net-worth buyers aged 35–55."
              value={settings.customPrompt}
              onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
            />
          </div>
        </div>

      {/* Save Button */}
      <div className="settings-save">
        {saveError && <p style={{ color: '#ff6b6b', marginBottom: '0.75rem' }}>{saveError}</p>}
        <button className="btn-primary btn-large" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "✓ Settings Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  CREATE POST PAGE — Step-by-step posting flow
// ════════════════════════════════════════════

const COLOR_OPTIONS = [
  { name: "Black",      hex: "#0a0a0a" },
  { name: "White",      hex: "#ffffff" },
  { name: "Gold",       hex: "#D4AF37" },
  { name: "Navy",       hex: "#1B3A6B" },
  { name: "Emerald",    hex: "#2ECC71" },
  { name: "Blush Pink", hex: "#FFB3BA" },
  { name: "Slate Gray", hex: "#708090" },
  { name: "Burgundy",   hex: "#800020" },
  { name: "Cream",      hex: "#FFFDD0" },
  { name: "Charcoal",   hex: "#36454F" },
];

const STYLE_OPTIONS = [
  { id: "luxury",  label: "Luxury",  desc: "Premium, high-end aesthetic",    accent: "#D4AF37" },
  { id: "bold",    label: "Bold",    desc: "Strong, impactful visuals",       accent: "#ff6b9d" },
  { id: "modern",  label: "Modern",  desc: "Clean lines, contemporary feel", accent: "#7ec8e3" },
  { id: "minimal", label: "Minimal", desc: "Simple, elegant, uncluttered",   accent: "#e8e8e8" },
  { id: "elegant", label: "Elegant", desc: "Refined, sophisticated look",    accent: "#b388ff" },
];

function DashPosting({ user, setDashPage }) {
  const [heroImage, setHeroImage]         = useState(null);  // base64 data URL
  const [heroPreview, setHeroPreview]     = useState(null);  // display URL
  const [style, setStyle]                 = useState(null);
  const [primaryColor, setPrimaryColor]   = useState(null);
  const [secondaryColor, setSecondaryColor] = useState(null);
  const [prompt, setPrompt]               = useState("");
  const [dragOver, setDragOver]           = useState(false);
  const [loading, setLoading]             = useState(false);
  const [success, setSuccess]             = useState(false);
  const [settings, setSettings]           = useState(null);
  const fileInputRef = useRef(null);

  // Derived step unlock logic
  const step1Done = !!heroImage;
  const step2Done = step1Done && !!style;
  const step3Done = step2Done && !!primaryColor && !!secondaryColor;
  const canPost   = step3Done; // Step 4 is optional

  // Fetch agent settings from Supabase
  useEffect(() => {
    /*
     * EDIT: Update the table name below to match your Supabase schema.
     * This assumes a table called 'agent_settings' with a 'user_id' column.
     */
    const fetchSettings = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("agent_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, [user]);

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setHeroImage(e.target.result);
      setHeroPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImageFile(e.dataTransfer.files[0]);
  };

  const handleRemoveImage = () => {
    setHeroImage(null);
    setHeroPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Reset all downstream steps
    setStyle(null);
    setPrimaryColor(null);
    setSecondaryColor(null);
    setPrompt("");
  };

  const resetFlow = () => {
    setSuccess(false);
    setHeroImage(null);
    setHeroPreview(null);
    setStyle(null);
    setPrimaryColor(null);
    setSecondaryColor(null);
    setPrompt("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBeginPosting = async () => {
    setLoading(true);
    const payload = {
      image:          heroImage,
      style,
      primaryColor:   primaryColor.name,
      primaryHex:     primaryColor.hex,
      secondaryColor: secondaryColor.name,
      secondaryHex:   secondaryColor.hex,
      prompt,
      userId:         user.id,
      userEmail:      user.email,
      settings:       settings || {},
    };

    try {
      /*
       * EDIT: Replace the URL below with your actual n8n webhook URL.
       * Example: "https://popfeed.app.n8n.cloud/webhook/begin-posting"
       */
      const response = await fetch("https://your-n8n.app.n8n.cloud/webhook/begin-posting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Webhook failed");
      setSuccess(true);
    } catch (err) {
      console.error("Begin posting error:", err.message);
      // EDIT: Add a toast/error message here for the user
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──
  if (success) {
    return (
      <div className="dash-content">
        <div className="posting-success">
          <div className="posting-success-icon">🚀</div>
          <h2 className="posting-success-title">Your post is being generated!</h2>
          <p className="posting-success-desc">
            Check the Posts tab shortly to review your content.
          </p>
          <div className="posting-success-actions">
            <button className="btn-primary" onClick={resetFlow}>
              Create Another Post
            </button>
            <button className="btn-outline" onClick={() => setDashPage("posts")}>
              Go to Posts →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Flow ──
  return (
    <div className="dash-content">
      <div className="dash-header">
        <h1 className="dash-title">Create Post</h1>
        <p className="dash-subtitle">
          Complete each step to generate your next listing post.
        </p>
      </div>

      <div className="posting-flow">

        {/* ══ Step 1: Hero Image ══ */}
        <div className="posting-step posting-step-visible">
          <div className="posting-step-header">
            <span className={`step-badge ${step1Done ? "done" : "active"}`}>
              {step1Done ? "✓" : "1"}
            </span>
            <span className="step-title">Hero Image</span>
            {step1Done && <span className="step-done-tag">✓ Uploaded</span>}
          </div>

          {!heroImage ? (
            <div
              className={`upload-zone ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="upload-zone-icon">🖼️</span>
              <p className="upload-zone-title">Drop your hero image here</p>
              <p className="upload-zone-sub">or click to browse · JPG, PNG, WEBP</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleImageFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="upload-preview-wrap">
              <img src={heroPreview} alt="Hero" className="upload-preview-img" />
              <button className="upload-remove-btn" onClick={handleRemoveImage}>
                ✕ Remove / Replace
              </button>
            </div>
          )}
        </div>

        {/* ══ Step 2: Style ══ */}
        {step1Done && (
          <div className="posting-step posting-step-animate">
            <div className="posting-step-header">
              <span className={`step-badge ${step2Done ? "done" : "active"}`}>
                {step2Done ? "✓" : "2"}
              </span>
              <span className="step-title">Visual Style</span>
              {step2Done && (
                <span className="step-done-tag">
                  ✓ {style.charAt(0).toUpperCase() + style.slice(1)}
                </span>
              )}
            </div>
            <div className="style-grid">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  className={`style-card ${style === s.id ? "selected" : ""}`}
                  style={style === s.id
                    ? { borderColor: s.accent, boxShadow: `0 0 24px ${s.accent}35` }
                    : {}}
                  onClick={() => setStyle(s.id)}
                >
                  <span className="style-accent-dot" style={{ background: s.accent }}></span>
                  <span className="style-label">{s.label}</span>
                  <span className="style-desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ Step 3: Colors ══ */}
        {step2Done && (
          <div className="posting-step posting-step-animate">
            <div className="posting-step-header">
              <span className={`step-badge ${step3Done ? "done" : "active"}`}>
                {step3Done ? "✓" : "3"}
              </span>
              <span className="step-title">Brand Colors</span>
              {step3Done && (
                <div className="step-color-chips">
                  <span
                    className="step-color-chip"
                    style={{ background: primaryColor.hex }}
                    title={primaryColor.name}
                  ></span>
                  <span
                    className="step-color-chip"
                    style={{ background: secondaryColor.hex }}
                    title={secondaryColor.name}
                  ></span>
                </div>
              )}
            </div>
            <div className="color-selectors">
              {/* Primary */}
              <div className="color-selector-group">
                <label className="color-selector-label">Primary Color</label>
                <div className="color-swatches">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.name}
                      className={`color-swatch ${primaryColor?.name === c.name ? "selected" : ""}`}
                      style={{ background: c.hex }}
                      title={c.name}
                      onClick={() => setPrimaryColor(c)}
                    >
                      {primaryColor?.name === c.name && (
                        <span className="swatch-check" style={{ color: c.hex === "#ffffff" || c.hex === "#FFFDD0" ? "#000" : "#fff" }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
                {primaryColor && (
                  <span className="color-selected-name">{primaryColor.name}</span>
                )}
              </div>
              {/* Secondary */}
              <div className="color-selector-group">
                <label className="color-selector-label">Secondary Color</label>
                <div className="color-swatches">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.name}
                      className={`color-swatch ${secondaryColor?.name === c.name ? "selected" : ""}`}
                      style={{ background: c.hex }}
                      title={c.name}
                      onClick={() => setSecondaryColor(c)}
                    >
                      {secondaryColor?.name === c.name && (
                        <span className="swatch-check" style={{ color: c.hex === "#ffffff" || c.hex === "#FFFDD0" ? "#000" : "#fff" }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
                {secondaryColor && (
                  <span className="color-selected-name">{secondaryColor.name}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ Step 4: Custom Prompt (optional) ══ */}
        {step3Done && (
          <div className="posting-step posting-step-animate">
            <div className="posting-step-header">
              <span className="step-badge active">4</span>
              <span className="step-title">Custom Prompt</span>
              <span className="step-optional-tag">Optional</span>
            </div>
            <div className="prompt-wrap">
              <input
                type="text"
                className="input-field prompt-input"
                maxLength={50}
                placeholder="e.g. Highlight the pool and open floor plan"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <span className={`prompt-counter ${prompt.length >= 45 ? "near-limit" : ""}`}>
                {prompt.length}/50
              </span>
            </div>
          </div>
        )}

        {/* ══ Step 5: Begin Posting ══ */}
        {canPost && (
          <div className="posting-step posting-step-animate">
            <button
              className="begin-posting-btn"
              onClick={handleBeginPosting}
              disabled={loading}
            >
              {loading ? (
                <span className="begin-posting-loading">
                  <span className="begin-spinner"></span>
                  Sending to PopFeed…
                </span>
              ) : (
                "🚀 Begin Posting"
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
