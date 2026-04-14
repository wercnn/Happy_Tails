import { useMemo, useState } from "react";
import "./identity.css";
import { useNavigate } from "react-router-dom";

const ID_TYPES = ["Passport", "Driving Licence"];

export default function IdentityVerification() {
  const navigate = useNavigate();
  const role = localStorage.getItem("userRole");
  const userStatus = String(localStorage.getItem("userStatus") || "");

  const [form, setForm] = useState({
    dob: "",
    idType: "",
    idNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [uploadState, setUploadState] = useState({
    front: null,
    back: null,
    selfie: null,
    uploading: false,
    message: "",
  });

  const MAX_BYTES = 8 * 1024 * 1024;

  const isValidUpload = (file) => {
    if (!file) return { ok: false, error: "No file selected." };
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return { ok: false, error: "Only JPG, PNG, or PDF files are allowed." };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "File is too large (max 8MB)." };
    }
    return { ok: true, error: "" };
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handlePick = async (field, file) => {
    const v = isValidUpload(file);
    if (!v.ok) {
      setUploadState((p) => ({ ...p, message: v.error }));
      return;
    }

    setUploadState((p) => ({ ...p, uploading: true, message: "Uploading (prototype)…" }));

    try {
      // Prototype: we encode it so the handler is “real”, but we always succeed.
      await toBase64(file);
      setUploadState((p) => ({
        ...p,
        [field]: { name: file.name, type: file.type, size: file.size },
        uploading: false,
        message: "Upload saved (prototype).",
      }));
    } catch (e) {
      setUploadState((p) => ({ ...p, uploading: false, message: e.message || "Upload failed." }));
    }
  };

  const statusIsActive = useMemo(() => userStatus.toLowerCase() === "active", [userStatus]);

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

    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Prototype flow: identity submission completes, but account may still be pending approval.
    if (!statusIsActive && role !== "support") {
      navigate("/pendingApproval");
      return;
    }

    if (role === "owner") navigate("/ownerDash");
    else if (role === "minder") navigate("/mindDash");
    else navigate("/");
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="verify-screen">
          <header className="verify-header">
            <button
              className="verify-back-icon"
              type="button"
              onClick={() => navigate(-1)}
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
                <label className="verify-label">Upload ID Front</label>
                <label className="verify-dropzone">
                  <div className="verify-upload-icon">↑</div>
                  <p className="verify-drop-text"><strong>Upload front of ID</strong></p>
                  <p className="verify-drop-sub">PNG, JPG or PDF</p>
                  {uploadState.front?.name && (
                    <p className="verify-drop-sub">Selected: {uploadState.front.name}</p>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => handlePick("front", e.target.files?.[0])}
                    disabled={uploadState.uploading}
                  />
                </label>
              </div>

              <div className="verify-field">
                <label className="verify-label">
                  Upload ID Back (Optional if applicable)
                </label>
                <label className="verify-dropzone">
                  <div className="verify-upload-icon">↑</div>
                  <p className="verify-drop-text"><strong>Upload back of ID</strong></p>
                  <p className="verify-drop-sub">Only needed for 2-sided documents</p>
                  {uploadState.back?.name && (
                    <p className="verify-drop-sub">Selected: {uploadState.back.name}</p>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => handlePick("back", e.target.files?.[0])}
                    disabled={uploadState.uploading}
                  />
                </label>
              </div>

              <div className="verify-field">
                <label className="verify-label">Upload Selfie</label>
                <label className="verify-dropzone">
                  <div className="verify-upload-icon">↑</div>
                  <p className="verify-drop-text"><strong>Upload a clear selfie</strong></p>
                  <p className="verify-drop-sub">Make sure your face is clearly visible</p>
                  {uploadState.selfie?.name && (
                    <p className="verify-drop-sub">Selected: {uploadState.selfie.name}</p>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    style={{ display: "none" }}
                    onChange={(e) => handlePick("selfie", e.target.files?.[0])}
                    disabled={uploadState.uploading}
                  />
                </label>
              </div>

              {uploadState.message && (
                <p className="verify-drop-sub" style={{ marginTop: 8 }}>
                  {uploadState.message}
                </p>
              )}

              <button
                className="verify-submit"
                type="button"
                onClick={handleSubmit}
              >
                {uploadState.uploading ? "UPLOADING…" : "Submit Verification →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}