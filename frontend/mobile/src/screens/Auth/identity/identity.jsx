import { useState } from "react";
import "./identity.css";
import { useNavigate } from "react-router-dom";

const ID_TYPES = ["Passport", "Driving Licence"];

export default function IdentityVerification() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    dob: "",
    idType: "",
    idNumber: "",
    address: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.dob.trim()) {
      newErrors.dob = "Date of birth is required.";
    }

    if (!form.idType.trim()) {
      newErrors.idType = "Please select an ID type.";
    }

    if (!form.idNumber.trim()) {
      newErrors.idNumber = "ID number is required.";
    }

    if (!form.address.trim()) {
      newErrors.address = "Address is required.";
    }

    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    navigate("/mindDash");
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="verify-screen">
          <header className="verify-header">
            <button
              className="verify-back-icon"
              type="button"
              onClick={() => navigate("/")}
            >
              ←
            </button>
            <h1 className="verify-title">Identity Verification</h1>
          </header>

          <div className="verify-scroll">
            <div className="verify-form">
              <div className="verify-step-heading">
                <h2 className="verify-step-title">Verify your identity</h2>
                <p className="verify-step-sub">
                  Help us keep Happy Tails safe and trusted for everyone
                </p>
              </div>

              <div className="verify-field">
                <label className="verify-label" htmlFor="dob">
                  Date of Birth
                </label>
                <input
                  id="dob"
                  name="dob"
                  className={`verify-input ${errors.dob ? "verify-input--error" : ""}`}
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                />
                {errors.dob && (
                  <p className="verify-error-text">{errors.dob}</p>
                )}
              </div>

              <div className="verify-field">
                <label className="verify-label" htmlFor="idType">
                  ID Type
                </label>
                <select
                  id="idType"
                  name="idType"
                  className={`verify-input ${errors.idType ? "verify-input--error" : ""}`}
                  value={form.idType}
                  onChange={handleChange}
                >
                  <option value="">Select ID type</option>
                  {ID_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.idType && (
                  <p className="verify-error-text">{errors.idType}</p>
                )}
              </div>

              <div className="verify-field">
                <label className="verify-label" htmlFor="idNumber">
                  ID Number
                </label>
                <input
                  id="idNumber"
                  name="idNumber"
                  className={`verify-input ${errors.idNumber ? "verify-input--error" : ""}`}
                  type="text"
                  placeholder="Enter ID document number"
                  value={form.idNumber}
                  onChange={handleChange}
                />
                {errors.idNumber && (
                  <p className="verify-error-text">{errors.idNumber}</p>
                )}
              </div>

              <div className="verify-field">
                <label className="verify-label" htmlFor="address">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  className={`verify-textarea ${errors.address ? "verify-input--error" : ""}`}
                  placeholder="Enter your home address"
                  value={form.address}
                  onChange={handleChange}
                />
                {errors.address && (
                  <p className="verify-error-text">{errors.address}</p>
                )}
              </div>

              <div className="verify-field">
                <label className="verify-label">Upload ID Front</label>
                <div className="verify-dropzone">
                  <div className="verify-upload-icon">↑</div>
                  <p className="verify-drop-text"><strong>Upload front of ID</strong></p>
                  <p className="verify-drop-sub">PNG, JPG or PDF</p>
                </div>
              </div>

              <div className="verify-field">
                <label className="verify-label">
                  Upload ID Back (Optional if applicable)
                </label>
                <div className="verify-dropzone">
                  <div className="verify-upload-icon">↑</div>
                  <p className="verify-drop-text"><strong>Upload back of ID</strong></p>
                  <p className="verify-drop-sub">Only needed for 2-sided documents</p>
                </div>
              </div>

              <div className="verify-field">
                <label className="verify-label">Upload Selfie</label>
                <div className="verify-dropzone">
                  <div className="verify-upload-icon">↑</div>
                  <p className="verify-drop-text"><strong>Upload a clear selfie</strong></p>
                  <p className="verify-drop-sub">Make sure your face is clearly visible</p>
                </div>
              </div>

              <button
                className="verify-submit"
                type="button"
                onClick={handleSubmit}
              >
                Submit Verification →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}