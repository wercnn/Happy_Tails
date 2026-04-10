import { useState } from "react";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./SettingsPage.css";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    platformFee: 5,
    escrowDays: 1,
    refundDays: 14,
  });

  function toggle(key) {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function handleChange(key, value) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleSave() {
    console.log("Saved settings:", settings);
    alert("Settings saved (demo)");
  }

  return (
    <div className="settings-page">
      <SectionHeader title="Platform Settings" />

      <div className="settings-page__grid">
        <Card>
          <div className="settings-page__card">
            <h3>Notifications</h3>

            <div className="settings-page__row">
              <span>Email Notifications</span>
              <button onClick={() => toggle("emailNotifications")}>
                {settings.emailNotifications ? "ON" : "OFF"}
              </button>
            </div>

            <div className="settings-page__row">
              <span>SMS Notifications</span>
              <button onClick={() => toggle("smsNotifications")}>
                {settings.smsNotifications ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="settings-page__card">
            <h3>Payments</h3>

            <div className="settings-page__row">
              <span>Platform Fee (%)</span>
              <input
                type="number"
                value={settings.platformFee}
                onChange={(e) =>
                  handleChange("platformFee", e.target.value)
                }
              />
            </div>

            <div className="settings-page__row">
              <span>Escrow Days</span>
              <input
                type="number"
                value={settings.escrowDays}
                onChange={(e) =>
                  handleChange("escrowDays", e.target.value)
                }
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="settings-page__card">
            <h3>Refunds</h3>

            <div className="settings-page__row">
              <span>Refund Window</span>
              <input
                type="number"
                value={settings.refundDays}
                onChange={(e) =>
                  handleChange("refundDays", e.target.value)
                }
              />
            </div>
          </div>
        </Card>

        <div className="settings-page__actions">
          <Btn variant="primary" onClick={handleSave}>
            Save Changes
          </Btn>
        </div>
      </div>
    </div>
  );
}