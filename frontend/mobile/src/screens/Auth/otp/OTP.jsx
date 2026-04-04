import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./OTP.css";

const LENGTH = 6;

export default function HappyTailsOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role;

  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const inputs = useRef([]);

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/, "").slice(-1);
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    const next = [...digits];
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, LENGTH - 1);
    inputs.current[focusIdx]?.focus();
  };

  const handleVerify = () => {
    navigate("/identity", { state: { role } });
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <main className="otp-screen">
          <header className="otp-header">
            <span className="otp-phone-emoji">📱</span>
            <h1 className="otp-heading">Verify Your Number</h1>
            <p className="otp-subtext">
              We sent a code to +44 7700 <span className="otp-masked">****</span>00
            </p>
          </header>

          <section className="otp-body">
            <p className="otp-label">Enter 6-digit OTP Code</p>

            <div className="otp-boxes" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputs.current[i] = el)}
                  className={`otp-box${d ? " otp-box--filled" : ""}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                />
              ))}
            </div>

            <button className="otp-submit" onClick={handleVerify}>
              Verify &amp; Continue →
            </button>

            <p className="otp-resend-row">
              Didn't receive code?{" "}
              <button className="otp-resend-link" onClick={() => alert("OTP resent!")}>
                Resend Code
              </button>
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}