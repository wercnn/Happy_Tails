import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ReportSubmitted.css";

const API_BASE = "http://localhost:3000";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id":   localStorage.getItem("userID")   || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

export default function HappyTailsReportSubmitted() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const incidentID = location.state?.incidentID || null;

  // Show first 8 chars of the UUID as a short case reference
  const caseRef = incidentID
    ? `#INC-${incidentID.slice(0, 8).toUpperCase()}`
    : "#INC-UNKNOWN";

  useEffect(() => {
    if (!incidentID) return;
    fetch(`${API_BASE}/api/reports/incident/${incidentID}/case-reference`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ caseReference: caseRef }),
    }).catch(() => {});
  }, [incidentID, caseRef]);

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="rs2-screen">
          <div className="rs2-body">

            {/* Clipboard icon */}
            <div className="rs2-icon-wrap">
              <span className="rs2-icon">📋</span>
            </div>

            {/* Heading */}
            <h1 className="rs2-heading">Report Submitted</h1>
            <p className="rs2-sub">
              Your incident report has been submitted. Our support team will
              review it and be in touch within 2 hours.
            </p>

            {/* Case reference card */}
            <div className="rs2-ref-card">
              <span className="rs2-ref-label">Case Reference</span>
              <span className="rs2-ref-value">{caseRef}</span>
            </div>

            {/* Return home */}
            <button
              className="rs2-home-btn"
              onClick={() => navigate("/mindDash")}
            >
              RETURN TO HOME
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
