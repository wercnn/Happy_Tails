import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./MinderRegister.css";

const SERVICES = ["Dog Walking", "Pet Sitting", "Home Boarding"];
const PETS = ["Dogs", "Cats", "Reptiles", "Birds"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HappyTailsMinderRegister() {
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
    bio: "",
    experience: "",
    hourlyRate: "",
  });

  const [photo, setPhoto] = useState(null);
  const [idDoc, setIdDoc] = useState(null);
  const [services, setServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [days, setDays] = useState([]);
  const [draggingPhoto, setDraggingPhoto] = useState(false);
  const [draggingId, setDraggingId] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const photoInputRef = useRef(null);
  const idInputRef = useRef(null);

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

  const handleFile = (file, setter) => {
    if (file) setter(file.name);
  };

  const toggle = (val, list, setter) =>
    setter((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );

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
      role: "minder",
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
          lastName: data.lastName,
          role: data.role,
        },
      });
    } catch (error) {
      console.error("Registration failed:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Server error. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const basicFields = [
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
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="mreg-screen">
          <header className="mreg-header">
            <button
              className="mreg-back-icon"
              onClick={() => navigate("/register")}
              type="button"
            >
              ←
            </button>
            <h1 className="mreg-title">Pet Minder Registration</h1>
          </header>

          <div className="mreg-scroll">
            <div className="mreg-form">
              <div className="mreg-step-heading">
                <h2 className="mreg-step-title">Create your profile</h2>
                <p className="mreg-step-sub">Step 1 of 2 – basic &amp; professional info</p>
              </div>

              {basicFields.map((f) => (
                <div className="mreg-field" key={f.name}>
                  <label className="mreg-label" htmlFor={f.name}>
                    {f.label}
                  </label>
                  <input
                    id={f.name}
                    name={f.name}
                    className={`mreg-input ${errors[f.name] ? "mreg-input--error" : ""}`}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                  {errors[f.name] && (
                    <p className="mreg-error-text">{errors[f.name]}</p>
                  )}
                </div>
              ))}

              <div className="mreg-field">
                <label className="mreg-label">Photo Upload (Optional)</label>
                <div
                  className={`mreg-dropzone${draggingPhoto ? " mreg-dropzone--active" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggingPhoto(true);
                  }}
                  onDragLeave={() => setDraggingPhoto(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDraggingPhoto(false);
                    handleFile(e.dataTransfer.files[0], setPhoto);
                  }}
                  onClick={() => photoInputRef.current?.click()}
                >
                  <div className="mreg-upload-icon">↑</div>
                  {photo ? (
                    <p className="mreg-drop-text">{photo}</p>
                  ) : (
                    <>
                      <p className="mreg-drop-text"><strong>Drop photo here</strong></p>
                      <p className="mreg-drop-sub">
                        or <span className="mreg-select-link">Select files</span>
                      </p>
                    </>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files[0], setPhoto)}
                  />
                </div>
              </div>

              <div className="mreg-field">
                <label className="mreg-label" htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  className="mreg-textarea"
                  placeholder="Tell me about yourself"
                  value={form.bio}
                  onChange={handleChange}
                />
              </div>

              <div className="mreg-field">
                <label className="mreg-label" htmlFor="experience">Years of Experience</label>
                <input
                  id="experience"
                  name="experience"
                  className="mreg-input"
                  type="number"
                  placeholder="e.g. 3"
                  value={form.experience}
                  onChange={handleChange}
                />
              </div>

              <div className="mreg-chip-section">
                <label className="mreg-chip-label">Services Offered</label>
                <div className="mreg-chips">
                  {SERVICES.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`mreg-chip${services.includes(s) ? " mreg-chip--active" : ""}`}
                      onClick={() => toggle(s, services, setServices)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mreg-chip-section">
                <label className="mreg-chip-label">Pets Supported</label>
                <div className="mreg-chips">
                  {PETS.map((p) => (
                    <button
                      type="button"
                      key={p}
                      className={`mreg-chip${pets.includes(p) ? " mreg-chip--active" : ""}`}
                      onClick={() => toggle(p, pets, setPets)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mreg-divider-section" />

              <div className="mreg-chip-section">
                <label className="mreg-chip-label">Hourly Rate</label>
                <div className="mreg-rate-row">
                  <div className="mreg-rate-currency">£</div>
                  <div className="mreg-rate-box">
                    <span className="mreg-rate-hint">RATE PER HOUR</span>
                    <input
                      name="hourlyRate"
                      className="mreg-rate-input"
                      type="number"
                      placeholder="e.g. 15.00"
                      value={form.hourlyRate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="mreg-chip-section">
                <label className="mreg-chip-label">General Availability</label>
                <div className="mreg-chips mreg-chips--days">
                  {DAYS.map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={`mreg-chip mreg-chip--day${days.includes(d) ? " mreg-chip--active" : ""}`}
                      onClick={() => toggle(d, days, setDays)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mreg-chip-section">
                <label className="mreg-chip-label">Identity Verification</label>
                <div
                  className={`mreg-dropzone${draggingId ? " mreg-dropzone--active" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggingId(true);
                  }}
                  onDragLeave={() => setDraggingId(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDraggingId(false);
                    handleFile(e.dataTransfer.files[0], setIdDoc);
                  }}
                  onClick={() => idInputRef.current?.click()}
                >
                  <div className="mreg-upload-icon">↑</div>
                  {idDoc ? (
                    <p className="mreg-drop-text">{idDoc}</p>
                  ) : (
                    <>
                      <p className="mreg-drop-text"><strong>Upload photo ID</strong></p>
                      <p className="mreg-drop-sub">Passport or driving licences · PDF or image</p>
                    </>
                  )}
                  <input
                    ref={idInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files[0], setIdDoc)}
                  />
                </div>
              </div>

              {errors.submit && (
                <p className="mreg-error-text">{errors.submit}</p>
              )}

              <button
                className="mreg-submit"
                onClick={handleSubmit}
                type="button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit for Verification →"}
              </button>

              <p className="mreg-login-prompt">
                Already have an account?{" "}
                <button
                  className="mreg-login-link"
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