import { useEffect, useState } from "react";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./SettingsPage.css";

const API_BASE = "http://localhost:3000";
const API_HEADERS = {
  "Content-Type": "application/json",
  "X-User-Id": "u-support-001",
  "X-User-Role": "support",
};

const EMAIL_TEMPLATE_KEYS = [
  { key: "bookingConfirmed", label: "Booking Confirmed" },
  { key: "minderVerified",   label: "Minder Verified"   },
  { key: "incidentAlert",    label: "Incident Alert"     },
  { key: "reviewRequest",    label: "Review Request"     },
];

// MySQL returns TINYINT(1) for BOOLEAN columns — coerce to JS boolean
function b(val) {
  return val === 1 || val === true;
}

function normalizeSettings(row) {
  return {
    emailNotifications:    b(row.emailNotifications),
    smsNotifications:      b(row.smsNotifications),
    bookingReminders:      b(row.bookingReminders),
    incidentAlerts:        b(row.incidentAlerts),
    platformFeePercent:    Number(row.platformFeePercent),
    escrowReleaseDays:     Number(row.escrowReleaseDays),
    refundWindowDays:      Number(row.refundWindowDays),
    stripeMode:            row.stripeMode ?? "Test",
    sessionTimeoutMins:    Number(row.sessionTimeoutMins),
    twoFAEnabled:          b(row.twoFAEnabled),
    auditLogRetentionDays: Number(row.auditLogRetentionDays),
    gdprMode:              b(row.gdprMode),
  };
}

// ── Toggle switch component ───────────────────────────────────────────────────

function Toggle({ value, onChange, disabled }) {
  return (
    <div
      role="switch"
      aria-checked={value}
      tabIndex={disabled ? -1 : 0}
      className={`settings-page__toggle ${value ? "settings-page__toggle--on" : "settings-page__toggle--off"} ${disabled ? "settings-page__toggle--disabled" : ""}`}
      onClick={() => !disabled && onChange(!value)}
      onKeyDown={(e) => e.key === " " && !disabled && onChange(!value)}
    >
      <div
        className={`settings-page__toggle-knob ${value ? "settings-page__toggle-knob--on" : "settings-page__toggle-knob--off"}`}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings]               = useState(null);
  const [draft, setDraft]                     = useState({});
  const [emailTemplates, setEmailTemplates]   = useState(null);
  const [saving, setSaving]                   = useState(null);
  const [saved, setSaved]                     = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateDraft, setTemplateDraft]     = useState({ subject: "", body: "" });
  const [savingTemplate, setSavingTemplate]   = useState(false);
  const [savedTemplate, setSavedTemplate]     = useState(false);
  const [error, setError]                     = useState("");

  // ── Fetch on mount ────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/settings`, { headers: API_HEADERS })
      .then((r) => r.json())
      .then((data) => {
        const normalized = normalizeSettings(data);
        console.log("Loaded settings:", normalized);
        setSettings(normalized);
        setDraft(normalized);
      })
      .catch(() => setError("Failed to load platform settings."));

    fetch(`${API_BASE}/api/admin/email-templates`, { headers: API_HEADERS })
      .then((r) => r.json())
      .then((data) => setEmailTemplates(data))
      .catch(() => setError("Failed to load email templates."));
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const change = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const markSaved = (section) => {
    setSaved(section);
    setTimeout(() => setSaved((s) => (s === section ? null : s)), 2500);
  };

  const saveSection = async (section, fields) => {
    setSaving(section);
    setError("");
    try {
      const payload = {};
      fields.forEach((f) => { payload[f] = draft[f]; });

      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: "PATCH",
        headers: API_HEADERS,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");

      const updated = normalizeSettings(data);
      setSettings(updated);
      setDraft((d) => ({ ...d, ...updated }));
      markSaved(section);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  // ── Email template editor ─────────────────────────────────────────────────

  const openTemplate = (key) => {
    const tpl = emailTemplates?.[key];
    if (!tpl) return;
    setEditingTemplate({ key, name: tpl.name });
    setTemplateDraft({ subject: tpl.subject, body: tpl.body });
    setSavedTemplate(false);
    setError("");
  };

  const closeTemplate = () => {
    setEditingTemplate(null);
    setTemplateDraft({ subject: "", body: "" });
    setSavedTemplate(false);
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    setSavingTemplate(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/email-templates/${editingTemplate.key}`,
        {
          method: "PATCH",
          headers: API_HEADERS,
          body: JSON.stringify({ subject: templateDraft.subject, body: templateDraft.body }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save template");
      setEmailTemplates((t) => ({ ...t, [editingTemplate.key]: data }));
      setSavedTemplate(true);
      setTimeout(closeTemplate, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingTemplate(false);
    }
  };

  const isLoading = settings === null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="settings-page">
      <SectionHeader
        title="Platform Settings"
        subtitle="Configure system parameters, notifications and compliance"
      />

      {error && (
        <Card style={{ padding: "10px 16px", marginBottom: 16, color: "#b91c1c", fontSize: 13 }}>
          {error}
        </Card>
      )}

      <div className="settings-page__grid">

        {/* ── Notification Settings ──────────────────────────────────────── */}
        <Card>
          <div className="settings-page__card">
            <h3 className="settings-page__title">🔔 Notification Settings</h3>
            <p className="settings-page__subtitle">Control which alerts are sent to platform users</p>

            {isLoading ? (
              <p className="settings-page__loading">Loading…</p>
            ) : (
              <>
                {[
                  { key: "emailNotifications", label: "Email Notifications" },
                  { key: "smsNotifications",   label: "SMS Notifications"   },
                  { key: "bookingReminders",   label: "Booking Reminders"   },
                  { key: "incidentAlerts",     label: "Incident Alerts"     },
                ].map(({ key, label }, i, arr) => (
                  <div
                    key={key}
                    className={`settings-page__row ${i < arr.length - 1 ? "settings-page__row--bordered" : ""}`}
                  >
                    <span className="settings-page__label">{label}</span>
                    <Toggle
                      value={draft[key] ?? false}
                      onChange={(v) => change(key, v)}
                    />
                  </div>
                ))}

                <div className="settings-page__actions">
                  <Btn
                    variant="primary"
                    disabled={saving === "notifications"}
                    onClick={() =>
                      saveSection("notifications", [
                        "emailNotifications",
                        "smsNotifications",
                        "bookingReminders",
                        "incidentAlerts",
                      ])
                    }
                  >
                    {saving === "notifications" ? "Saving…" : "Save Changes"}
                  </Btn>
                  {saved === "notifications" && (
                    <span className="settings-page__saved-badge">✓ Saved</span>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* ── Payment Settings ───────────────────────────────────────────── */}
        <Card>
          <div className="settings-page__card">
            <h3 className="settings-page__title">💳 Payment Settings</h3>
            <p className="settings-page__subtitle">Adjust fee structure and escrow behaviour</p>

            {isLoading ? (
              <p className="settings-page__loading">Loading…</p>
            ) : (
              <>
                {[
                  { key: "platformFeePercent", label: "Platform Fee (%)",       min: 0,  max: 100 },
                  { key: "escrowReleaseDays",  label: "Escrow Release (days)",  min: 1            },
                  { key: "refundWindowDays",   label: "Refund Window (days)",   min: 1            },
                ].map(({ key, label, min, max }, i) => (
                  <div key={key} className="settings-page__row settings-page__row--bordered">
                    <span className="settings-page__label">{label}</span>
                    <input
                      type="number"
                      min={min}
                      max={max}
                      value={draft[key] ?? ""}
                      onChange={(e) => change(key, Number(e.target.value))}
                      className="settings-page__input"
                    />
                  </div>
                ))}

                <div className="settings-page__row">
                  <span className="settings-page__label">Stripe API Mode</span>
                  <select
                    value={draft.stripeMode ?? "Test"}
                    onChange={(e) => change("stripeMode", e.target.value)}
                    className="settings-page__select"
                  >
                    <option value="Live">Live</option>
                    <option value="Test">Test</option>
                  </select>
                </div>

                <div className="settings-page__actions">
                  <Btn
                    variant="primary"
                    disabled={saving === "payment"}
                    onClick={() =>
                      saveSection("payment", [
                        "platformFeePercent",
                        "escrowReleaseDays",
                        "refundWindowDays",
                        "stripeMode",
                      ])
                    }
                  >
                    {saving === "payment" ? "Saving…" : "Save Changes"}
                  </Btn>
                  {saved === "payment" && (
                    <span className="settings-page__saved-badge">✓ Saved</span>
                  )}
                </div>
                <p className="settings-page__note">
                  ⚠️ Stripe integration requires additional configuration outside this panel.
                </p>
              </>
            )}
          </div>
        </Card>

        {/* ── Security & Compliance ──────────────────────────────────────── */}
        <Card>
          <div className="settings-page__card">
            <h3 className="settings-page__title">🔒 Security & Compliance</h3>
            <p className="settings-page__subtitle">Session, 2FA and data retention controls</p>

            {isLoading ? (
              <p className="settings-page__loading">Loading…</p>
            ) : (
              <>
                <div className="settings-page__row settings-page__row--bordered">
                  <span className="settings-page__label">Session Timeout (mins)</span>
                  <input
                    type="number"
                    min={5}
                    value={draft.sessionTimeoutMins ?? 30}
                    onChange={(e) => change("sessionTimeoutMins", Number(e.target.value))}
                    className="settings-page__input"
                  />
                </div>

                <div className="settings-page__row settings-page__row--bordered">
                  <span className="settings-page__label">2FA for Admins</span>
                  <Toggle
                    value={draft.twoFAEnabled ?? false}
                    onChange={(v) => change("twoFAEnabled", v)}
                  />
                </div>

                <div className="settings-page__row settings-page__row--bordered">
                  <span className="settings-page__label">Audit Log Retention (days)</span>
                  <input
                    type="number"
                    min={1}
                    value={draft.auditLogRetentionDays ?? 365}
                    onChange={(e) => change("auditLogRetentionDays", Number(e.target.value))}
                    className="settings-page__input"
                  />
                </div>

                <div className="settings-page__row">
                  <span className="settings-page__label">GDPR Mode</span>
                  <Toggle
                    value={draft.gdprMode ?? false}
                    onChange={(v) => change("gdprMode", v)}
                  />
                </div>

                <div className="settings-page__actions">
                  <Btn
                    variant="primary"
                    disabled={saving === "security"}
                    onClick={() =>
                      saveSection("security", [
                        "sessionTimeoutMins",
                        "twoFAEnabled",
                        "auditLogRetentionDays",
                        "gdprMode",
                      ])
                    }
                  >
                    {saving === "security" ? "Saving…" : "Save Changes"}
                  </Btn>
                  {saved === "security" && (
                    <span className="settings-page__saved-badge">✓ Saved</span>
                  )}
                </div>
                <p className="settings-page__note">
                  ⚠️ Security enforcement is prototype-level. Full 2FA and audit log
                  infrastructure requires additional setup.
                </p>
              </>
            )}
          </div>
        </Card>

        {/* ── Email Templates ────────────────────────────────────────────── */}
        <Card>
          <div className="settings-page__card">
            <h3 className="settings-page__title">📧 Email Templates</h3>
            <p className="settings-page__subtitle">Edit the content of automated system emails</p>

            {emailTemplates === null ? (
              <p className="settings-page__loading">Loading…</p>
            ) : (
              <>
                {EMAIL_TEMPLATE_KEYS.map(({ key, label }, i, arr) => (
                  <div
                    key={key}
                    className={`settings-page__row ${i < arr.length - 1 ? "settings-page__row--bordered" : ""}`}
                  >
                    <div>
                      <span className="settings-page__label">{label}</span>
                      {emailTemplates[key]?.subject && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6f7a8a" }}>
                          {emailTemplates[key].subject.length > 48
                            ? emailTemplates[key].subject.slice(0, 48) + "…"
                            : emailTemplates[key].subject}
                        </p>
                      )}
                    </div>
                    <Btn variant="ghost" small onClick={() => openTemplate(key)}>
                      Edit →
                    </Btn>
                  </div>
                ))}

                <p className="settings-page__note">
                  Supports variables: {"{{"}<span>ownerName</span>{"}}"},{" "}
                  {"{{"}<span>minderName</span>{"}}"},{" "}
                  {"{{"}<span>date</span>{"}}"},{" "}
                  {"{{"}<span>service</span>{"}}"}
                </p>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ── Email template editor modal ──────────────────────────────────── */}
      {editingTemplate && (
        <div className="settings-page__overlay" onClick={closeTemplate}>
          <div
            className="settings-page__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="settings-page__modal-close"
              onClick={closeTemplate}
            >
              ✕
            </button>

            <h3 className="settings-page__modal-title">
              📧 {editingTemplate.name}
            </h3>
            <p className="settings-page__modal-desc">
              Edit the subject line and body of this automated email.
            </p>

            <div className="settings-page__modal-field">
              <label className="settings-page__modal-label">Subject</label>
              <input
                type="text"
                value={templateDraft.subject}
                onChange={(e) =>
                  setTemplateDraft((d) => ({ ...d, subject: e.target.value }))
                }
                className="settings-page__input--full"
                placeholder="Email subject line…"
              />
            </div>

            <div className="settings-page__modal-field">
              <label className="settings-page__modal-label">Body</label>
              <textarea
                value={templateDraft.body}
                onChange={(e) =>
                  setTemplateDraft((d) => ({ ...d, body: e.target.value }))
                }
                className="settings-page__textarea"
                placeholder="Email body text…"
              />
              <p className="settings-page__vars-hint">
                Available variables: {"{{ownerName}}"}, {"{{minderName}}"},
                {"{{date}}"}, {"{{time}}"}, {"{{service}}"}, {"{{petName}}"},
                {"{{reviewLink}}"}, {"{{incidentID}}"}
              </p>
            </div>

            <div className="settings-page__modal-actions">
              <Btn variant="ghost" onClick={closeTemplate}>
                Cancel
              </Btn>
              <Btn
                variant="primary"
                disabled={savingTemplate || savedTemplate}
                onClick={saveTemplate}
              >
                {savedTemplate ? "✓ Saved" : savingTemplate ? "Saving…" : "Save Template"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
