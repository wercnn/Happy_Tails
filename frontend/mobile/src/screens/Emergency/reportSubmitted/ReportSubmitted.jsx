import "./ReportSubmitted.css";

const REPORT = {
  caseRef: "#INC-20260409-002",
  responseTime: "2 hours",
};

export default function HappyTailsReportSubmitted() {
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
              review it and be in touch within {REPORT.responseTime}.
            </p>

            {/* Case reference card */}
            <div className="rs2-ref-card">
              <span className="rs2-ref-label">Case Reference</span>
              <span className="rs2-ref-value">{REPORT.caseRef}</span>
            </div>

            {/* Return home */}
            <button
              className="rs2-home-btn"
              onClick={() => alert("Navigate to Home")}
            >
              RETURN TO HOME
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}