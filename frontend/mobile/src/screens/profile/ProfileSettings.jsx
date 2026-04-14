import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileSettings.css";

const API_BASE = "http://localhost:3000";

const MENU_ITEMS = [
  { id: "edit",    emoji: "👤", label: "Edit Profile" },
  { id: "notifs",  emoji: "🔔", label: "Notification Preferences" },
  { id: "payment", emoji: "💳", label: "Payment Methods" },
  { id: "privacy", emoji: "🔒", label: "Privacy & Security" },
  { id: "help",    emoji: "❓", label: "Help & Support" },
  { id: "terms",   emoji: "📄", label: "Terms & Privacy Policy" },
  { id: "logout",  emoji: "🚪", label: "Log Out", danger: true },
];

const OWNER_NAV_ITEMS = [
  { id: "home",     emoji: "🏠", label: "Home" },
  { id: "pets",     emoji: "🐾", label: "My Pets" },
  { id: "search",   emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile",  emoji: "👤", label: "Profile" },
];

const MINDER_NAV_ITEMS = [
  { id: "dashboard",    emoji: "🏠", label: "Dashboard" },
  { id: "services",     emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests",     emoji: "📬", label: "Requests" },
  { id: "profile",      emoji: "👤", label: "Profile" },
];

const ROLE_LABEL = { owner: "Pet Owner", minder: "Pet Minder", support: "Support" };

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id":   localStorage.getItem("userID")   || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

// ── Shared panel shell ────────────────────────────────────────────────────────

function PanelShell({ title, onBack, children }) {
  return (
    <div className="prof-panel">
      <header className="prof-panel-header">
        <button className="prof-panel-back" type="button" onClick={onBack}>←</button>
        <h1 className="prof-panel-title">{title}</h1>
      </header>
      <div className="prof-panel-scroll">{children}</div>
    </div>
  );
}

// ── Edit Profile ──────────────────────────────────────────────────────────────

function EditProfilePanel({ profile, onBack }) {
  const firstName = localStorage.getItem("firstName") || profile?.firstName || "Alex";
  const lastName  = localStorage.getItem("lastName")  || profile?.lastName  || "Johnson";
  const email     = localStorage.getItem("userEmail") || profile?.email     || "alex@example.com";

  const fields = [
    { label: "First Name",    value: firstName },
    { label: "Last Name",     value: lastName },
    { label: "Email",         value: email },
    { label: "Phone",         value: profile?.phone          || "+44 7700 900123" },
    { label: "Date of Birth", value: profile?.dateOfBirth    || "15 Mar 1990" },
    { label: "Location",      value: profile?.city           || "London, UK" },
    ...(profile?.role === "minder"
      ? [
          { label: "Experience", value: profile?.experienceYears ? `${profile.experienceYears} years` : "3 years" },
          { label: "Bio", value: profile?.bio || "Passionate animal lover with years of experience caring for pets of all sizes.", multiline: true },
        ]
      : []),
  ];

  return (
    <PanelShell title="Edit Profile" onBack={onBack}>
      <div className="prof-ep-avatar-wrap">
        <div className="prof-ep-avatar">👤</div>
        <button className="prof-ep-change-photo" type="button">Change Photo</button>
      </div>

      <div className="prof-ep-fields">
        {fields.map((f) => (
          <div key={f.label} className="prof-ep-field">
            <span className="prof-ep-field-label">{f.label}</span>
            <span className={`prof-ep-field-value${f.multiline ? " prof-ep-field-value--multi" : ""}`}>
              {f.value}
            </span>
          </div>
        ))}
      </div>

      <p className="prof-panel-note">To update your details, please contact support.</p>
    </PanelShell>
  );
}

// ── Notification Preferences ──────────────────────────────────────────────────

function NotifsPanel({ onBack }) {
  const [prefs, setPrefs] = useState({
    bookingConfirm: true,
    newRequests:    true,
    reminders:      true,
    promotions:     false,
    appUpdates:     false,
  });

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const items = [
    { key: "bookingConfirm", label: "Booking Confirmations",  sub: "Get notified when a booking is confirmed" },
    { key: "newRequests",    label: "New Booking Requests",   sub: "Get notified about incoming requests" },
    { key: "reminders",      label: "Booking Reminders",      sub: "Reminders 24 hours before a booking" },
    { key: "promotions",     label: "Promotional Offers",     sub: "Deals and special offers" },
    { key: "appUpdates",     label: "App Updates",            sub: "News about Happy Tails features" },
  ];

  return (
    <PanelShell title="Notification Preferences" onBack={onBack}>
      <div className="prof-list">
        {items.map((item) => (
          <div key={item.key} className="prof-list-row prof-list-row--toggle">
            <div className="prof-list-row-text">
              <span className="prof-list-row-label">{item.label}</span>
              <span className="prof-list-row-sub">{item.sub}</span>
            </div>
            <button
              type="button"
              className={`prof-toggle${prefs[item.key] ? " prof-toggle--on" : ""}`}
              onClick={() => toggle(item.key)}
              aria-pressed={prefs[item.key]}
            >
              <span className="prof-toggle-knob" />
            </button>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

// ── Payment Methods ───────────────────────────────────────────────────────────

function PaymentPanel({ onBack }) {
  const cards = [
    { last4: "4242", expiry: "09/27", type: "Visa",       primary: true },
    { last4: "5555", expiry: "03/26", type: "Mastercard", primary: false },
  ];

  return (
    <PanelShell title="Payment Methods" onBack={onBack}>
      <div className="prof-list">
        {cards.map((c) => (
          <div key={c.last4} className="prof-list-row">
            <span className="prof-list-row-emoji">💳</span>
            <div className="prof-list-row-text">
              <span className="prof-list-row-label">{c.type} •••• {c.last4}</span>
              <span className="prof-list-row-sub">Expires {c.expiry}</span>
            </div>
            {c.primary && <span className="prof-badge">Primary</span>}
          </div>
        ))}
        <button className="prof-action-btn" type="button">+ Add Payment Method</button>
      </div>
    </PanelShell>
  );
}

// ── Privacy & Security ────────────────────────────────────────────────────────

function PrivacyPanel({ onBack }) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  const requestDeletion = async () => {
    try {
      setDeleting(true);
      setDeleteErr("");
      const res = await fetch(`${API_BASE}/api/users/me/request-deletion`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: "User requested from settings (prototype)." }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to request deletion.");

      localStorage.setItem("userStatus", "Suspended");
      localStorage.setItem("deletionRequested", "true");
      navigate("/accountBlocked");
    } catch (e) {
      setDeleteErr(e.message || "Could not request deletion.");
      setDeleting(false);
    }
  };

  const items = [
    { label: "Change Password",           sub: "Last changed 3 months ago",        badge: null,  danger: false },
    { label: "Two-Factor Authentication", sub: "Adds an extra layer of security",   badge: "On",  danger: false },
    { label: "Connected Accounts",        sub: "Google, Apple",                     badge: null,  danger: false },
    { label: "Data & Privacy",            sub: "Download or delete your data",      badge: null,  danger: false },
    { label: "Delete Account",            sub: "Permanently remove your account",   badge: null,  danger: true  },
  ];

  return (
    <PanelShell title="Privacy & Security" onBack={onBack}>
      <div className="prof-list">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`prof-list-row prof-list-row--btn${item.danger ? " prof-list-row--danger" : ""}`}
            onClick={() => {
              if (item.label === "Delete Account") setShowDeleteConfirm(true);
            }}
          >
            <div className="prof-list-row-text">
              <span className="prof-list-row-label">{item.label}</span>
              <span className="prof-list-row-sub">{item.sub}</span>
            </div>
            {item.badge && (
              <span className="prof-badge prof-badge--green">{item.badge}</span>
            )}
            {!item.danger && <span className="prof-list-chevron">›</span>}
          </button>
        ))}
      </div>

      {showDeleteConfirm && (
        <div
          className="prof-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (deleting) return;
            setShowDeleteConfirm(false);
            setDeleteErr("");
          }}
        >
          <div className="prof-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="prof-modal-title">Request account deletion?</h2>
            <p className="prof-modal-text">
              This will temporarily suspend your account until Customer Support reviews the request.
            </p>

            {deleteErr && <p className="prof-modal-error">⚠ {deleteErr}</p>}

            <div className="prof-modal-actions">
              <button
                className="prof-modal-btn prof-modal-btn--secondary"
                type="button"
                onClick={() => {
                  if (deleting) return;
                  setShowDeleteConfirm(false);
                  setDeleteErr("");
                }}
              >
                Cancel
              </button>
              <button
                className="prof-modal-btn prof-modal-btn--danger"
                type="button"
                onClick={requestDeletion}
                disabled={deleting}
              >
                {deleting ? "Requesting…" : "Request deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelShell>
  );
}

// ── Help & Support ────────────────────────────────────────────────────────────

function HelpPanel({ onBack }) {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "How do I book a pet minder?",
      a: "Search for minders in your area, view their profile, select a service and available dates, then submit a booking request.",
    },
    {
      q: "How do payments work?",
      a: "Payments are processed securely through our platform. Funds are held until the service is completed.",
    },
    {
      q: "Can I cancel a booking?",
      a: "Yes, you can cancel a booking from the Bookings tab. Cancellation policies may vary by minder.",
    },
    {
      q: "How do I report an issue?",
      a: "Use the 'Report an Incident' button on any booking detail page to submit a report to our support team.",
    },
    {
      q: "How do I become a pet minder?",
      a: "Register as a minder, complete identity verification, then set up your services and availability.",
    },
  ];

  return (
    <PanelShell title="Help & Support" onBack={onBack}>
      <div className="prof-list">
        <p className="prof-section-heading">Frequently Asked Questions</p>

        {faqs.map((faq, i) => (
          <div key={i} className="prof-faq">
            <button
              type="button"
              className="prof-faq-q"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <span>{faq.q}</span>
              <span className="prof-faq-chevron">{openFaq === i ? "⌃" : "⌄"}</span>
            </button>
            {openFaq === i && <p className="prof-faq-a">{faq.a}</p>}
          </div>
        ))}

        <p className="prof-section-heading" style={{ marginTop: 16 }}>Contact Us</p>

        <div className="prof-list-row">
          <span className="prof-list-row-emoji">✉️</span>
          <div className="prof-list-row-text">
            <span className="prof-list-row-label">Email Support</span>
            <span className="prof-list-row-sub">support@happytails.com</span>
          </div>
        </div>

        <div className="prof-list-row">
          <span className="prof-list-row-emoji">📞</span>
          <div className="prof-list-row-text">
            <span className="prof-list-row-label">Phone Support</span>
            <span className="prof-list-row-sub">+44 20 7946 0321 · Mon–Fri 9–5</span>
          </div>
        </div>
      </div>

      <p className="prof-panel-note" style={{ marginTop: 20 }}>Version 1.0.0 · Happy Tails © 2025</p>
    </PanelShell>
  );
}

// ── Terms & Privacy Policy ────────────────────────────────────────────────────

function TermsPanel({ onBack }) {
  return (
    <PanelShell title="Terms & Privacy Policy" onBack={onBack}>
      <div className="prof-terms">
        <h2 className="prof-terms-heading">Terms of Service</h2>
        <p>By using Happy Tails, you agree to these terms. Happy Tails is a platform connecting pet owners with pet minders. We facilitate bookings but are not responsible for the services provided by minders.</p>

        <h2 className="prof-terms-heading">User Responsibilities</h2>
        <p>Users must provide accurate information, treat other users respectfully, and comply with all applicable laws. Pet owners are responsible for providing accurate information about their pets.</p>

        <h2 className="prof-terms-heading">Bookings & Payments</h2>
        <p>All bookings are subject to minder availability. Payments are processed securely through our platform. Refund eligibility is determined by the minder's cancellation policy.</p>

        <h2 className="prof-terms-heading">Privacy Policy</h2>
        <p>We collect information you provide when registering, including name, email, and location. This data is used solely to operate the platform and improve our services.</p>

        <h2 className="prof-terms-heading">Data Storage</h2>
        <p>Your data is stored securely and will not be sold to third parties. You may request deletion of your account and data at any time by contacting support.</p>

        <h2 className="prof-terms-heading">Cookies</h2>
        <p>Happy Tails uses local storage to maintain your session and preferences. No third-party advertising cookies are used.</p>

        <p className="prof-terms-updated">Last updated: April 2026</p>
      </div>
    </PanelShell>
  );
}

// ── Log Out confirmation ──────────────────────────────────────────────────────

function LogoutPanel({ onBack, onConfirm }) {
  return (
    <div className="prof-logout-panel">
      <div className="prof-logout-body">
        <div className="prof-logout-icon">🚪</div>
        <h2 className="prof-logout-title">Log Out</h2>
        <p className="prof-logout-sub">Are you sure you want to log out of Happy Tails?</p>
        <button className="prof-logout-confirm" type="button" onClick={onConfirm}>
          Yes, Log Out
        </button>
        <button className="prof-logout-cancel" type="button" onClick={onBack}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main profile screen ───────────────────────────────────────────────────────

export default function HappyTailsProfile() {
  const navigate = useNavigate();
  const role = localStorage.getItem("userRole");

  const navItems = role === "owner" ? OWNER_NAV_ITEMS : MINDER_NAV_ITEMS;
  const [activeNav,   setActiveNav]   = useState("profile");
  const [activePanel, setActivePanel] = useState(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const userID = localStorage.getItem("userID");
    if (!userID) return;

    fetch(`${API_BASE}/api/users/${userID}`, { headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    ["userID", "userRole", "userEmail", "username", "firstName", "lastName"].forEach(
      (k) => localStorage.removeItem(k)
    );
    navigate("/");
  };

  const handleMenu = (id) => {
    setActivePanel(id);
  };

  const handleNavClick = (id) => {
    setActiveNav(id);

    if (role === "owner") {
      switch (id) {
        case "home":     navigate("/ownerDash");    break;
        case "pets":     navigate("/ownerPets");    break;
        case "search":   navigate("/ownerSearch");  break;
        case "bookings": navigate("/ownerBooking"); break;
        case "profile":  navigate("/profile");      break;
        default: break;
      }
    } else {
      switch (id) {
        case "dashboard":    navigate("/mindDash");         break;
        case "services":     navigate("/mindService");      break;
        case "availability": navigate("/mindAvailability"); break;
        case "requests":     navigate("/mindRequests");     break;
        case "profile":      navigate("/profile");          break;
        default: break;
      }
    }
  };

  const displayName = `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim() || "—";
  const displayRole = profile ? ROLE_LABEL[profile.role] || profile.role : ROLE_LABEL[role] || role || "—";
  const displayCity = profile?.city || "";
  const displaySub  = displayCity ? `${displayRole} · ${displayCity}` : displayRole;
  const isVerified  = profile?.status === "Active";

  const minderStats = profile?.role === "minder"
    ? {
        rating:     profile.ratingAvg       != null ? Number(profile.ratingAvg || 0).toFixed(1) : "—",
        experience: profile.experienceYears != null ? profile.experienceYears : "—",
      }
    : null;

  const closePanel = () => setActivePanel(null);

  const renderPanel = () => {
    switch (activePanel) {
      case "edit":    return <EditProfilePanel profile={profile} onBack={closePanel} />;
      case "notifs":  return <NotifsPanel onBack={closePanel} />;
      case "payment": return <PaymentPanel onBack={closePanel} />;
      case "privacy": return <PrivacyPanel onBack={closePanel} />;
      case "help":    return <HelpPanel onBack={closePanel} />;
      case "terms":   return <TermsPanel onBack={closePanel} />;
      case "logout":  return <LogoutPanel onBack={closePanel} onConfirm={handleLogout} />;
      default:        return null;
    }
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="prof-screen">

          {activePanel ? renderPanel() : (
            <>
              <header className="prof-hero">
                <div className="prof-avatar">
                  <span className="prof-avatar-icon">👤</span>
                </div>

                {loading && <h1 className="prof-name">Loading...</h1>}
                {error   && <h1 className="prof-name" style={{ fontSize: "0.9rem", color: "#ef4444" }}>{error}</h1>}

                {!loading && !error && (
                  <>
                    <h1 className="prof-name">{displayName}</h1>
                    <p className="prof-sub">{displaySub}</p>

                    {isVerified && (
                      <div className="prof-verified">
                        <span>✓</span>
                        <span>Verified Account</span>
                      </div>
                    )}

                    {minderStats && (
                      <div className="prof-stats-row">
                        <div className="prof-stat">
                          <span className="prof-stat-value">⭐ {minderStats.rating}</span>
                          <span className="prof-stat-label">Rating</span>
                        </div>
                        <div className="prof-stat">
                          <span className="prof-stat-value">{minderStats.experience} yrs</span>
                          <span className="prof-stat-label">Experience</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </header>

              <div className="prof-scroll">
                <div className="prof-menu">
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      className={`prof-menu-item${item.danger ? " prof-menu-item--danger" : ""}`}
                      onClick={() => handleMenu(item.id)}
                    >
                      <span className="prof-menu-emoji">{item.emoji}</span>
                      <span className="prof-menu-label">{item.label}</span>
                      {!item.danger && <span className="prof-menu-chevron">›</span>}
                    </button>
                  ))}
                </div>
              </div>

              <nav className="prof-nav">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    className={`prof-nav-item${activeNav === item.id ? " prof-nav-item--active" : ""}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <span className="prof-nav-emoji">{item.emoji}</span>
                    <span className="prof-nav-label">{item.label}</span>
                  </button>
                ))}
              </nav>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
