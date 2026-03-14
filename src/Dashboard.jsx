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
  const [stats, setStats] = useState({ views: 0, likes: 0, posts: 0, accounts: 0 });

  useEffect(() => {
    // Posts count
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setStats(s => ({ ...s, posts: count || 0 })));

    // Analytics totals
    supabase
      .from('post_analytics')
      .select('views, likes')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const totalViews = data.reduce((sum, r) => sum + (r.views || 0), 0);
          const totalLikes = data.reduce((sum, r) => sum + (r.likes || 0), 0);
          setStats(s => ({ ...s, views: totalViews, likes: totalLikes }));
        }
      });

    // Accounts linked: 0 until OAuth is implemented
  }, [user.id]);

  const quickStats = [
    { label: "Total Views", value: stats.views.toLocaleString(), icon: "👁️", color: "#ff6b9d" },
    { label: "Total Likes", value: stats.likes.toLocaleString(), icon: "❤️", color: "#b388ff" },
    { label: "Posts Created", value: stats.posts.toLocaleString(), icon: "📝", color: "#7ec8e3" },
    { label: "Accounts Linked", value: stats.accounts.toString(), icon: "🔗", color: "#ff6b9d" },
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
  const [analyticsRows, setAnalyticsRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('post_analytics')
      .select('views, likes, reach, fetched_at, posts(platform)')
      .eq('user_id', user.id)
      .gte('fetched_at', from)
      .order('fetched_at', { ascending: true });

    query.then(({ data, error }) => {
      if (error) console.error('Failed to load analytics:', error.message);
      let rows = data || [];
      if (selectedPlatform !== 'all') {
        rows = rows.filter(r => r.posts?.platform === selectedPlatform);
      }
      setAnalyticsRows(rows);
      setLoading(false);
    });
  }, [user.id, timeRange, selectedPlatform]);

  // Group rows by time bucket and aggregate
  const buildChartData = () => {
    if (analyticsRows.length === 0) return [];
    const buckets = {};
    analyticsRows.forEach(r => {
      const d = new Date(r.fetched_at);
      let key;
      if (timeRange === "7d") {
        key = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
      } else if (timeRange === "30d") {
        const weekNum = Math.ceil(d.getDate() / 7);
        key = `${d.toLocaleDateString(undefined, { month: 'short' })} W${weekNum}`;
      } else {
        key = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      }
      if (!buckets[key]) buckets[key] = { date: key, views: 0, likes: 0, reach: 0 };
      buckets[key].views += r.views || 0;
      buckets[key].likes += r.likes || 0;
      buckets[key].reach += r.reach || 0;
    });
    return Object.values(buckets);
  };

  const chartData = buildChartData();
  const totalViews = analyticsRows.reduce((sum, r) => sum + (r.views || 0), 0);
  const totalLikes = analyticsRows.reduce((sum, r) => sum + (r.likes || 0), 0);
  const totalReach = analyticsRows.reduce((sum, r) => sum + (r.reach || 0), 0);

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
          <span className="analytics-stat-label">Total Reach</span>
          <span className="analytics-stat-value" style={{ color: "#7ec8e3" }}>
            {totalReach.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card analytics-chart-card">
        <h3 className="chart-title">Performance Over Time</h3>
        {loading ? (
          <p style={{ color: "var(--text-dim)", padding: "2rem 0", textAlign: "center" }}>
            Loading analytics...
          </p>
        ) : chartData.length === 0 ? (
          <p style={{ color: "var(--text-dim)", padding: "2rem 0", textAlign: "center" }}>
            No analytics data yet. Data will appear here once your posts start getting engagement.
          </p>
        ) : (
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
                  dataKey="reach"
                  stroke="#7ec8e3"
                  strokeWidth={2}
                  dot={{ fill: "#7ec8e3", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  POSTS PAGE — View Generated Content
// ════════════════════════════════════════════
const PLATFORM_LOGOS = {
  instagram: "https://cdn.simpleicons.org/instagram/E1306C",
  facebook: "https://cdn.simpleicons.org/facebook/1877F2",
  tiktok: "https://cdn.simpleicons.org/tiktok/ffffff",
  linkedin: "https://cdn.simpleicons.org/linkedin/0A66C2",
  x: "https://cdn.simpleicons.org/x/ffffff",
};

function DashPosts({ user }) {
  const [filter, setFilter] = useState("all");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    supabase
      .from('posts')
      .select('*, post_analytics(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Failed to load posts:', error.message);
        if (data) {
          setPosts(data.map(p => {
            const latestAnalytics = p.post_analytics?.length > 0
              ? p.post_analytics[p.post_analytics.length - 1]
              : null;
            const ts = p.posted_at || p.created_at;
            const d = new Date(ts);
            return {
              id: p.id,
              platform: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
              logo: PLATFORM_LOGOS[p.platform] || "",
              status: p.status,
              date: d.toLocaleDateString(),
              time: p.posted_at ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
              caption: p.content,
              imageUrl: p.image_url || null,
              engagement: latestAnalytics
                ? { views: latestAnalytics.views, likes: latestAnalytics.likes }
                : null,
            };
          }));
        }
        setLoading(false);
      });
  }, [user.id]);

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
        {loading ? (
          <div className="glass-card empty-state">
            <p style={{ color: "var(--text-dim)" }}>Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="glass-card empty-state">
            <p style={{ color: "var(--text-dim)" }}>
              {posts.length === 0
                ? "No posts yet. Run your automation to generate content."
                : "No posts match this filter."}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="glass-card post-card">
              {post.imageUrl && (
                <div className="post-image-wrap" onClick={() => setLightbox(post.imageUrl)} style={{ cursor: "zoom-in" }}>
                  <img src={post.imageUrl} alt="" className="post-image" />
                </div>
              )}
              <div className="post-content">
                <div className="post-meta">
                  <span className="post-platform">
                    {post.logo && (
                      <img src={post.logo} alt={post.platform} className="post-platform-icon" />
                    )}
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={lightbox}
            alt=""
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "12px", boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
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
  const [heroFile, setHeroFile]           = useState(null);  // original File object
  const [heroPreview, setHeroPreview]     = useState(null);  // display URL
  const [listingUrl, setListingUrl]       = useState("");
  const [style, setStyle]                 = useState(null);
  const [primaryColor, setPrimaryColor]   = useState(null);
  const [secondaryColor, setSecondaryColor] = useState(null);
  const [prompt, setPrompt]               = useState("");
  const [dragOver, setDragOver]           = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState(false);
  const [settings, setSettings]           = useState(null);
  const fileInputRef = useRef(null);

  // Derived step unlock logic
  const step1Done = !!heroFile;
  const step2Done = step1Done && !!style;       // listing URL is optional, doesn't block
  const step3Done = step2Done && !!primaryColor && !!secondaryColor;
  const canPost   = step3Done; // Step 4 + listing URL are optional

  // Fetch agent settings from Supabase
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => { if (data) setSettings(data); });
  }, [user]);

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImageFile(e.dataTransfer.files[0]);
  };

  const handleRemoveImage = () => {
    setHeroFile(null);
    setHeroPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStyle(null);
    setPrimaryColor(null);
    setSecondaryColor(null);
    setPrompt("");
  };

  const resetFlow = () => {
    setSuccess(false);
    setHeroFile(null);
    setHeroPreview(null);
    setListingUrl("");
    setStyle(null);
    setPrimaryColor(null);
    setSecondaryColor(null);
    setPrompt("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBeginPosting = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Upload image to Supabase Storage
      const ext = heroFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, heroFile, { contentType: heroFile.type, upsert: false });

      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(uploadData.path);

      // 2. Trigger automation with image + overlay params
      const response = await fetch('/api/trigger-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:         user.id,
          imageUrl:       publicUrl,
          style,
          primaryHex:     primaryColor.hex,
          secondaryHex:   secondaryColor.hex,
          overlayPrompt:  prompt,
          listingUrl:     listingUrl.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Automation failed');
      setSuccess(true);
    } catch (err) {
      console.error("Begin posting error:", err.message);
      setError(err.message);
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

          {!heroFile ? (
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

        {/* ══ Step 2: Listing URL (optional) ══ */}
        {step1Done && (
          <div className="posting-step posting-step-animate">
            <div className="posting-step-header">
              <span className="step-badge active">2</span>
              <span className="step-title">Listing URL</span>
              <span className="step-optional-tag">Optional</span>
              {listingUrl.trim() && <span className="step-done-tag">✓ Added</span>}
            </div>
            <div className="prompt-wrap">
              <input
                type="url"
                className="input-field prompt-input"
                placeholder="https://www.zillow.com/homedetails/..."
                value={listingUrl}
                onChange={(e) => setListingUrl(e.target.value)}
              />
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.4rem" }}>
              Paste a Zillow, Redfin, or Realtor.com link to auto-fill price, beds, baths, and more.
            </p>
          </div>
        )}

        {/* ══ Step 3: Style ══ */}
        {step1Done && (
          <div className="posting-step posting-step-animate">
            <div className="posting-step-header">
              <span className={`step-badge ${step2Done ? "done" : "active"}`}>
                {step2Done ? "✓" : "3"}
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

        {/* ══ Step 4: Colors ══ */}
        {step2Done && (
          <div className="posting-step posting-step-animate">
            <div className="posting-step-header">
              <span className={`step-badge ${step3Done ? "done" : "active"}`}>
                {step3Done ? "✓" : "4"}
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

        {/* ══ Step 5: Custom Prompt (optional) ══ */}
        {step3Done && (
          <div className="posting-step posting-step-animate">
            <div className="posting-step-header">
              <span className="step-badge active">5</span>
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
            {error && (
              <p style={{ color: "#ff6b6b", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                {error}
              </p>
            )}
            <button
              className="begin-posting-btn"
              onClick={handleBeginPosting}
              disabled={loading}
            >
              {loading ? (
                <span className="begin-posting-loading">
                  <span className="begin-spinner"></span>
                  Uploading & generating…
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
