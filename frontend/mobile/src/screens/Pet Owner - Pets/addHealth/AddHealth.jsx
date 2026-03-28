import { useState } from "react";
import "./AddHealth.css";

const EVENT_TYPES = ["Vaccination", "Vet Visit", "Medication", "Surgery", "Dental", "Other"];

export default function HappyTailsHealthData() {
  const [form, setForm] = useState({
    date: "", eventType: "Vaccination", vet: "", weight: "", notes: "",
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="hd-screen">

          {/* Header */}
          <header className="hd-header">
            <button className="hd-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="hd-title">Add Health Data</h1>
          </header>

          {/* Scrollable body */}
          <div className="hd-scroll">
            <div className="hd-form">

              {/* Date */}
              <div className="hd-field">
                <label className="hd-label" htmlFor="date">Date</label>
                <input
                  id="date" name="date" className="hd-input"
                  type="text" placeholder="dd/mm/yyyy"
                  value={form.date} onChange={handleChange}
                />
              </div>

              {/* Health Event Type */}
              <div className="hd-field">
                <label className="hd-label" htmlFor="eventType">Health Event Type</label>
                <div className="hd-select-wrap">
                  <select
                    id="eventType" name="eventType" className="hd-select"
                    value={form.eventType} onChange={handleChange}
                  >
                    {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <span className="hd-select-arrow">V</span>
                </div>
              </div>

              {/* Vet / Clinic Name */}
              <div className="hd-field">
                <label className="hd-label" htmlFor="vet">Vet / Clinic Name</label>
                <input
                  id="vet" name="vet" className="hd-input"
                  type="text" placeholder="e.g. Luton Animal Clinic"
                  value={form.vet} onChange={handleChange}
                />
              </div>

              {/* Weight */}
              <div className="hd-field">
                <label className="hd-label" htmlFor="weight">Weight (kg)</label>
                <input
                  id="weight" name="weight" className="hd-input"
                  type="number" placeholder="e.g. 28.5"
                  value={form.weight} onChange={handleChange}
                />
              </div>

              {/* Notes */}
              <div className="hd-field">
                <label className="hd-label" htmlFor="notes">Notes</label>
                <textarea
                  id="notes" name="notes" className="hd-textarea"
                  placeholder="Details about this health entry..."
                  value={form.notes} onChange={handleChange}
                />
              </div>

              {/* Save */}
              <button className="hd-save" onClick={() => alert("Health record saved!")}>
                Save Health Record
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}