import { C } from "../constants.js";
import { Btn } from "../components/btn/Btn.jsx";
import { Card } from "../components/card/Card.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";

export default function SettingsPage() {
  return (
    <div>
      <SectionHeader title="Platform Settings" subtitle="Configure system parameters, notifications and compliance" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {[
          {
            title: "🔔 Notification Settings",
            fields: [
              ["Email Notifications", "toggle", "true"],
              ["SMS Notifications", "toggle", "true"],
              ["Booking Reminders", "toggle", "true"],
              ["Incident Alerts", "toggle", "true"],
            ],
          },
          {
            title: "💳 Payment Settings",
            fields: [
              ["Platform Fee (%)", "number", "5"],
              ["Escrow Release (days)", "number", "1"],
              ["Refund Window (days)", "number", "14"],
              ["Stripe API Mode", "select", "Live"],
            ],
          },
          {
            title: "🔒 Security & Compliance",
            fields: [
              ["Session Timeout (mins)", "number", "30"],
              ["2FA for Admins", "toggle", "true"],
              ["Audit Log Retention (days)", "number", "365"],
              ["GDPR Mode", "toggle", "true"],
            ],
          },
          {
            title: "📧 Email Templates",
            fields: [
              ["Booking Confirmed", "link", "Edit"],
              ["Minder Verified", "link", "Edit"],
              ["Incident Alert", "link", "Edit"],
              ["Review Request", "link", "Edit"],
            ],
          },
        ].map((section) => (
          <Card key={section.title} style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", color: C.navy, fontWeight: 800, fontSize: 15 }}>{section.title}</h3>
            {section.fields.map(([label, type, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.dark }}>{label}</span>
                {type === "toggle" && (
                  <div style={{ width: 40, height: 22, borderRadius: 11, background: val === "true" ? C.green : C.mid, position: "relative", cursor: "pointer" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.white, position: "absolute", top: 2, left: val === "true" ? 20 : 2 }} />
                  </div>
                )}
                {type === "number" && (
                  <input
                    defaultValue={val}
                    type="number"
                    style={{
                      width: 70,
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 6,
                      padding: "5px 8px",
                      fontSize: 13,
                      fontFamily: "inherit",
                      color: C.navy,
                      textAlign: "right",
                    }}
                  />
                )}
                {type === "select" && (
                  <select defaultValue={val} style={{ border: `1.5px solid ${C.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 13, fontFamily: "inherit", color: C.navy }}>
                    <option>Live</option>
                    <option>Test</option>
                  </select>
                )}
                {type === "link" && (
                  <Btn variant="ghost" small>
                    → {val}
                  </Btn>
                )}
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <Btn variant="primary">Save Changes</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

