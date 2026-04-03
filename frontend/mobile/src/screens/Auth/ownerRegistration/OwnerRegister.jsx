import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerRegister.css";

export default function HappyTailsRegister() {
  const navigate = useNavigate();
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
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((f) => ({ ...f, [name]: value }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
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

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = form.phone.replace(/\D/g, "");

    if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (phoneDigits.length !== 11) {
      newErrors.phone = "Phone number must be 11 digits.";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required.";
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    alert("Creating account…");
  };

  const fields = [
    { label: "First Name", name: "firstName", type: "text", placeholder: "e.g. Sarah" },
    { label: "Last Name", name: "lastName", type: "text", placeholder: "e.g. Johnson" },
    { label: "Email Address", name: "email", type: "email", placeholder: "sarah@gmail.com" },
    { label: "Phone Number", name: "phone", type: "tel", placeholder: "+44 7700 555444" },
    { label: "Password", name: "password", type: "password", placeholder: "Create a strong password" },
    { label: "Confirm Password", name: "confirmPassword", type: "password", placeholder: "Repeat password" },
    { label: "Postcode / Location", name: "postcode", type: "text", placeholder: "e.g. LU1 1AA" },
  ];

  return (
    <div className="mobile-stage owner-reg-stage">
      <div className="mobile-frame">
        <div className="reg-screen">
          <header className="reg-header">
            <button className="reg-back-icon" onClick={() => navigate("/register")}>
              ←
            </button>
            <h1 className="reg-title">Pet Owner Registration</h1>
          </header>

          <div className="reg-scroll">
            <div className="reg-form">
              {fields.map((f) => (
                <div className="reg-field" key={f.name}>
                  <label className="reg-label" htmlFor={f.name}>
                    {f.label}
                  </label>
                  <input
                    id={f.name}
                    name={f.name}
                    className={`reg-input ${errors[f.name] ? "reg-input--error" : ""}`}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                  {errors[f.name] && (
                    <p className="reg-error-text">{errors[f.name]}</p>
                  )}
                </div>
              ))}

              <div className="reg-field">
                <label className="reg-label">Photo Upload (Optional)</label>
                <div
                  className={`reg-dropzone${dragging ? " reg-dropzone--active" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  {photo ? (
                    <img src={photo} alt="Preview" className="reg-photo-preview" />
                  ) : (
                    <>
                      <div className="reg-upload-icon">↑</div>
                      <p className="reg-drop-text">Drop photo here</p>
                      <p className="reg-drop-sub">
                        or{" "}
                        <button
                          type="button"
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

              <button className="reg-submit" onClick={handleSubmit}>
                Create Account →
              </button>

              <p className="reg-login-prompt">
                Already have an account?{" "}
                <button className="reg-login-link" onClick={() => navigate("/login")}>
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