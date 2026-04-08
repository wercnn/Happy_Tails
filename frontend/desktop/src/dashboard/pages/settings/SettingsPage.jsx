import { C } from "../../constants.js";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./SettingsPage.css";

export default function SettingsPage() {
  const sections = [
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
  ];

  return (
    <div className="settings-page">
      <SectionHeader
        title="Platform Settings"
        subtitle="Configure system parameters, notifications and compliance"
      />

      <div className="settings-page__grid">
        {sections.map((section) => (
          <Card key={section.title}>
            <div className="settings-page__card">
              <h3 className="settings-page__title">{section.title}</h3>

              {section.fields.map(([label, type, val], index) => (
                <div
                  key={label}
                  className={`settings-page__row ${
                    index < section.fields.length - 1
                      ? "settings-page__row--bordered"
                      : ""
                  }`}
                >
                  <span className="settings-page__label">{label}</span>

                  {type === "toggle" && (
                    <div
                      className={`settings-page__toggle ${
                        val === "true"
                          ? "settings-page__toggle--on"
                          : "settings-page__toggle--off"
                      }`}
                    >
                      <div
                        className={`settings-page__toggle-knob ${
                          val === "true"
                            ? "settings-page__toggle-knob--on"
                            : "settings-page__toggle-knob--off"
                        }`}
                      />
                    </div>
                  )}

                  {type === "number" && (
                    <input
                      defaultValue={val}
                      type="number"
                      className="settings-page__input"
                    />
                  )}

                  {type === "select" && (
                    <select
                      defaultValue={val}
                      className="settings-page__select"
                    >
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

              <div className="settings-page__actions">
                <Btn variant="primary">Save Changes</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}