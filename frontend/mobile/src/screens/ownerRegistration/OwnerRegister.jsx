import { useState, useRef } from "react";
import "./OwnerRegister.css";

export default function HappyTailsRegister() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    postcode: "",
  });
  const [photo, setPhoto] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setPhoto(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const fields = [
    { label: "First Name",        name: "firstName",       type: "text",     placeholder: "e.g. Sarah" },
    { label: "Last Name",         name: "lastName",        type: "text",     placeholder: "e.g. Johnson" },
    { label: "Email Address",     name: "email",           type: "email",    placeholder: "sarah@gmail.com" },
    { label: "Phone Number",      name: "phone",           type: "tel",      placeholder: "+44 7700 555444" },
    { label: "Password",          name: "password",        type: "password", placeholder: "Create a strong password" },
    { label: "Confirm Password",  name: "confirmPassword", type: "password", placeholder: "Repeat password" },
    { label: "Postcode / Location", name: "postcode",      type: "text",     placeholder: "e.g. LU1 1AA" },
  ];

  return (
    <div className="mobile-stage owner-reg-stage">
      <div className="mobile-frame">
        <div className="reg-screen">
          {/* Sticky header */}
          <header className="reg-header">
            <button className="reg-back-icon" onClick={() => alert("Go back")}>←</button>
            <h1 className="reg-title">Pet Owner Registration</h1>
          </header>

          {/* Scrollable body */}
          <div className="reg-scroll">
            <div className="reg-form">
              {fields.map((f) => (
                <div className="reg-field" key={f.name}>
                  <label className="reg-label" htmlFor={f.name}>{f.label}</label>
                  <input
                    id={f.name}
                    name={f.name}
                    className="reg-input"
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
              ))}

              {/* Photo Upload */}
              <div className="reg-field">
                <label className="reg-label">Photo Upload (Optional)</label>
                <div
                  className={`reg-dropzone${dragging ? " reg-dropzone--active" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  {photo ? (
                    <img src={photo} alt="Preview" className="reg-photo-preview" />
                  ) : (
                    <>
                      <div className="reg-upload-icon">↑</div>
                      <p className="reg-drop-text">
                        <strong>Drop photo here</strong>
                      </p>
                      <p className="reg-drop-sub">
                        or{" "}
                        <button
                          className="reg-select-link"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Select files
                        </button>
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                </div>
              </div>

              {/* Submit */}
              <button className="reg-submit" onClick={() => alert("Creating account…")}>
                Create Account →
              </button>

              <p className="reg-login-prompt">
                Already have an account?{" "}
                <button className="reg-login-link" onClick={() => alert("Navigate to Login")}>
                  Log in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}