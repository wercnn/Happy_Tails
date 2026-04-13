import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerRegister.css";

export default function HappyTailsRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    postcode: "",
  });

  const [photo, setPhoto] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "postcode" ? value.toUpperCase() : value;

    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      submit: "",
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

    if (!form.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }

    if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!form.username.trim()) {
      newErrors.username = "Username is required.";
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

    if (!form.address.trim()) {
      newErrors.address = "Address is required.";
    }

    if (!form.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!form.postcode.trim()) {
      newErrors.postcode = "Postcode is required.";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      password: form.password,
      phoneNumber: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      postcode: form.postcode.trim().toUpperCase(),
      role: "owner",
    };

    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          submit: data.error || "Registration failed.",
        }));
        return;
      }

      localStorage.setItem("userID", data.userID);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("username", data.username || form.username.trim());
      localStorage.setItem("firstName", data.firstName || form.firstName.trim());
      localStorage.setItem("lastName", data.lastName || form.lastName.trim());

      navigate("/otp", {
        state: {
          userID: data.userID,
          profileID: data.profileID,
          email: data.email,
          firstName: data.firstName,
          role: data.role,
        },
      });
    } catch (error) {
      console.error("Owner registration failed:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Server error. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { label: "First Name", name: "firstName", type: "text", placeholder: "e.g. Sarah" },
    { label: "Last Name", name: "lastName", type: "text", placeholder: "e.g. Johnson" },
    { label: "Email Address", name: "email", type: "email", placeholder: "sarah@gmail.com" },
    { label: "Username", name: "username", type: "text", placeholder: "e.g. sarahjohnson" },
    { label: "Phone Number", name: "phone", type: "tel", placeholder: "+44 7700 555444" },
    { label: "Password", name: "password", type: "password", placeholder: "Create a strong password" },
    { label: "Confirm Password", name: "confirmPassword", type: "password", placeholder: "Repeat password" },
    { label: "Address", name: "address", type: "text", placeholder: "e.g. 12 High Street" },
    { label: "City", name: "city", type: "text", placeholder: "e.g. Luton" },
    { label: "Postcode / Location", name: "postcode", type: "text", placeholder: "e.g. LU1 1AA" },
  ];

  return (
    <div className="mobile-stage owner-reg-stage">
      <div className="mobile-frame">
        <div className="reg-screen">
          <header className="reg-header">
            <button
              className="reg-back-icon"
              onClick={() => navigate("/register")}
              type="button"
            >
              ←
            </button>
            <h1 className="reg-title">Pet Owner Registration</h1>
          </header>

          <div className="reg-scroll">
            <div className="reg-form">
              <div className="reg-step-heading">
                <h2 className="reg-step-title">Create your profile</h2>
              </div>

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

              {errors.submit && (
                <p className="reg-error-text">{errors.submit}</p>
              )}

              <button
                className="reg-submit"
                onClick={handleSubmit}
                type="button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account →"}
              </button>

              <p className="reg-login-prompt">
                Already have an account?{" "}
                <button
                  className="reg-login-link"
                  onClick={() => navigate("/login")}
                  type="button"
                >
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