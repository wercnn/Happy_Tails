import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./VisitReport.css";

const API_BASE = "http://localhost:3000";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id": localStorage.getItem("userID") || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

export default function VisitReport() {
  const navigate = useNavigate();
  const location = useLocation();

  const booking = location.state?.booking || null;
  const initialChecklist = location.state?.checklist || [];
  const initialMedChecklist = location.state?.medChecklist || [];
  const petRequiresMedication = !!location.state?.petRequiresMedication;
  const medicationQualified = !!location.state?.medicationQualified;

  const [checklist, setChecklist] = useState(
    Array.isArray(initialChecklist)
      ? initialChecklist.map((t) => ({ ...t, completed: !!t.completed }))
      : []
  );
  const [medChecklist, setMedChecklist] = useState(
    Array.isArray(initialMedChecklist)
      ? initialMedChecklist.map((t) => ({ ...t, completed: !!t.completed }))
      : []
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const completedCount = useMemo(
    () => checklist.filter((t) => t.completed).length,
    [checklist]
  );
  const medCompletedCount = useMemo(
    () => medChecklist.filter((t) => t.completed).length,
    [medChecklist]
  );

  const handleSubmit = async () => {
    if (!booking?.bookingID) {
      setError("Missing booking ID.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        bookingID: booking.bookingID,
        taskChecklist: JSON.stringify({
          care: checklist.map((t) => ({
            id: t.id,
            label: t.label,
            completed: !!t.completed,
            disabled: !!t.disabled,
            reason: t.reason || "",
          })),
          medication: medChecklist.map((t) => ({
            id: t.id,
            label: t.label,
            completed: !!t.completed,
            disabled: !!t.disabled,
            reason: t.reason || "",
          })),
        }),
        behaviouralNotes: notes || null,
        completedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      };

      const res = await fetch(`${API_BASE}/api/reports/visit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit report.");

      navigate(-1);
    } catch (e) {
      setError(e.message || "Could not submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) {
    return (
      <div className="mobile-stage">
        <div className="mobile-frame">
          <div className="vr-screen">
            <header className="vr-header">
              <button className="vr-back" type="button" onClick={() => navigate(-1)}>←</button>
              <h1 className="vr-title">Visit Report</h1>
            </header>
            <div className="vr-body">
              <div className="vr-card">
                <p className="vr-muted">No booking provided.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="vr-screen">
          <header className="vr-header">
            <button className="vr-back" type="button" onClick={() => navigate(-1)}>←</button>
            <h1 className="vr-title">Visit Report</h1>
          </header>

          <div className="vr-scroll">
            <div className="vr-body">
              <section className="vr-card">
                <h2 className="vr-card-title">Checklist</h2>
                <p className="vr-sub">
                  {completedCount}/{checklist.length} completed
                </p>

                <div className="vr-checklist">
                  {checklist.map((t) => (
                    <label
                      key={t.id}
                      className={`vr-check${t.disabled ? " vr-check--disabled" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={t.completed}
                        disabled={t.disabled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setChecklist((prev) =>
                            prev.map((x) =>
                              x.id === t.id ? { ...x, completed: checked } : x
                            )
                          );
                        }}
                      />
                      <span className="vr-check-label">{t.label}</span>
                      {t.disabled && t.reason && (
                        <span className="vr-check-reason">{t.reason}</span>
                      )}
                    </label>
                  ))}
                </div>
              </section>

              <section className="vr-card">
                <h2 className="vr-card-title">Medication checklist</h2>
                <p className="vr-sub">{medCompletedCount}/{medChecklist.length} completed</p>

                <div className="vr-med-status-row">
                  <span className="vr-med-status-item">
                    <span className="vr-med-status-label">Medication required</span>
                    <span className={`vr-med-status-badge ${petRequiresMedication ? "vr-med-status-badge--yes" : "vr-med-status-badge--no"}`}>
                      {petRequiresMedication ? "Yes" : "No"}
                    </span>
                  </span>
                  <span className="vr-med-status-item">
                    <span className="vr-med-status-label">Qualified</span>
                    <span className={`vr-med-status-badge ${medicationQualified ? "vr-med-status-badge--yes" : "vr-med-status-badge--no"}`}>
                      {medicationQualified ? "Yes" : "No"}
                    </span>
                  </span>
                </div>

                {!petRequiresMedication && (
                  <div className="vr-med-banner vr-med-banner--info">
                    This pet does not require medication. These tasks are disabled.
                  </div>
                )}
                {petRequiresMedication && !medicationQualified && (
                  <div className="vr-med-banner vr-med-banner--warn">
                    You are not qualified to administer medication. These tasks are disabled.
                  </div>
                )}

                <div className="vr-checklist">
                  {medChecklist.map((t) => (
                    <label
                      key={t.id}
                      className={`vr-check${t.disabled ? " vr-check--disabled" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={t.completed}
                        disabled={t.disabled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setMedChecklist((prev) =>
                            prev.map((x) =>
                              x.id === t.id ? { ...x, completed: checked } : x
                            )
                          );
                        }}
                      />
                      <span className="vr-check-label">{t.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="vr-card">
                <h2 className="vr-card-title">Behavioural notes</h2>
                <textarea
                  className="vr-textarea"
                  rows={5}
                  placeholder="How was the pet? Any issues, mood, appetite, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </section>

              {error && <p className="vr-error">⚠ {error}</p>}
            </div>
          </div>

          <div className="vr-footer">
            <button
              className="vr-submit"
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "SUBMITTING…" : "Submit Visit Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

