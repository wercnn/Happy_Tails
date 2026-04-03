import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./MinderRegister.css";

const SERVICES = ["Dog Walking", "Pet Sitting", "Home Boarding"];
const PETS = ["Dogs", "Cats", "Reptiles", "Birds"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HappyTailsMinderRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", password: "", confirmPassword: "", postcode: "",
    bio: "", experience: "", hourlyRate: "",
  });
  const [photo, setPhoto] = useState(null);
  const [idDoc, setIdDoc] = useState(null);
  const [services, setServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [days, setDays] = useState([]);
  const [draggingPhoto, setDraggingPhoto] = useState(false);
  const [draggingId, setDraggingId] = useState(false);

  const photoInputRef = useRef(null);
  const idInputRef = useRef(null);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = (file, setter) => {
    if (file) setter(file.name);
  };

  const toggle = (val, list, setter) =>
    setter((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );

  const basicFields = [
    { label: "First Name",          name: "firstName",       type: "text",     placeholder: "e.g. Sarah" },
    { label: "Last Name",           name: "lastName",        type: "text",     placeholder: "e.g. Johnson" },
    { label: "Email Address",       name: "email",           type: "email",    placeholder: "sarah@gmail.com" },
    { label: "Phone Number",        name: "phone",           type: "tel",      placeholder: "+44 7700 555444" },
    { label: "Password",            name: "password",        type: "password", placeholder: "Create a strong password" },
    { label: "Confirm Password",    name: "confirmPassword", type: "password", placeholder: "Repeat password" },
    { label: "Postcode / Location", name: "postcode",        type: "text",     placeholder: "e.g. LU1 1AA" },
  ];

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="mreg-screen">

          {/* Sticky header */}
          <header className="mreg-header">
            <button className="mreg-back-icon" onClick={() => navigate('/register')}>
              ←
            </button>
            <h1 className="mreg-title">Pet Minder Registration</h1>
          </header>

          {/* Scrollable body */}
          <div className="mreg-scroll">
            <div className="mreg-form">

              {/* ── STEP 1 ── */}
              <div className="mreg-step-heading">
                <h2 className="mreg-step-title">Create your profile</h2>
                <p className="mreg-step-sub">Step 1 of 2 – basic &amp; professional info</p>
              </div>

              {basicFields.map((f) => (
                <div className="mreg-field" key={f.name}>
                  <label className="mreg-label" htmlFor={f.name}>{f.label}</label>
                  <input
                    id={f.name} name={f.name} className="mreg-input"
                    type={f.type} placeholder={f.placeholder}
                    value={form[f.name]} onChange={handleChange} autoComplete="off"
                  />
                </div>
              ))}

              {/* Photo upload */}
              <div className="mreg-field">
                <label className="mreg-label">Photo Upload (Optional)</label>
                <div
                  className={`mreg-dropzone${draggingPhoto ? " mreg-dropzone--active" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDraggingPhoto(true); }}
                  onDragLeave={() => setDraggingPhoto(false)}
                  onDrop={(e) => { e.preventDefault(); setDraggingPhoto(false); handleFile(e.dataTransfer.files[0], setPhoto); }}
                  onClick={() => photoInputRef.current?.click()}
                >
                  <div className="mreg-upload-icon">↑</div>
                  {photo
                    ? <p className="mreg-drop-text">{photo}</p>
                    : <>
                        <p className="mreg-drop-text"><strong>Drop photo here</strong></p>
                        <p className="mreg-drop-sub">or <span className="mreg-select-link">Select files</span></p>
                      </>
                  }
                  <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files[0], setPhoto)} />
                </div>
              </div>

              {/* Bio */}
              <div className="mreg-field">
                <label className="mreg-label" htmlFor="bio">Bio</label>
                <textarea
                  id="bio" name="bio" className="mreg-textarea"
                  placeholder="Tell me about yourself"
                  value={form.bio} onChange={handleChange}
                />
              </div>

              {/* Years of experience */}
              <div className="mreg-field">
                <label className="mreg-label" htmlFor="experience">Years of Experience</label>
                <input
                  id="experience" name="experience" className="mreg-input"
                  type="number" placeholder="e.g. 3"
                  value={form.experience} onChange={handleChange}
                />
              </div>

              {/* Services */}
              <div className="mreg-chip-section">
                <label className="mreg-chip-label">Services Offered</label>
                <div className="mreg-chips">
                  {SERVICES.map((s) => (
                    <button
                      key={s}
                      className={`mreg-chip${services.includes(s) ? " mreg-chip--active" : ""}`}
                      onClick={() => toggle(s, services, setServices)}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Pets */}
              <div className="mreg-chip-section">
                <label className="mreg-chip-label">Pets Supported</label>
                <div className="mreg-chips">
                  {PETS.map((p) => (
                    <button
                      key={p}
                      className={`mreg-chip${pets.includes(p) ? " mreg-chip--active" : ""}`}
                      onClick={() => toggle(p, pets, setPets)}
                    >{p}</button>
                  ))}
                </div>
              </div>

              {/* ── STEP 2 ── */}
              <div className="mreg-divider-section" />

              {/* Hourly Rate */}
              <div className="mreg-chip-section">
                <label className="mreg-chip-label">Hourly Rate</label>
                <div className="mreg-rate-row">
                  <div className="mreg-rate-currency">£</div>
                  <div className="mreg-rate-box">
                    <span className="mreg-rate-hint">RATE PER HOUR</span>
                    <input
                      name="hourlyRate" className="mreg-rate-input"
                      type="number" placeholder="e.g. 15.00"
                      value={form.hourlyRate} onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="mreg-chip-section">
                <label className="mreg-chip-label">General Availability</label>
                <div className="mreg-chips mreg-chips--days">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      className={`mreg-chip mreg-chip--day${days.includes(d) ? " mreg-chip--active" : ""}`}
                      onClick={() => toggle(d, days, setDays)}
                    >{d}</button>
                  ))}
                </div>
              </div>

              {/* Identity Verification */}
              <div className="mreg-chip-section">
                <label className="mreg-chip-label">Identity Verification</label>
                <div
                  className={`mreg-dropzone${draggingId ? " mreg-dropzone--active" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDraggingId(true); }}
                  onDragLeave={() => setDraggingId(false)}
                  onDrop={(e) => { e.preventDefault(); setDraggingId(false); handleFile(e.dataTransfer.files[0], setIdDoc); }}
                  onClick={() => idInputRef.current?.click()}
                >
                  <div className="mreg-upload-icon">↑</div>
                  {idDoc
                    ? <p className="mreg-drop-text">{idDoc}</p>
                    : <>
                        <p className="mreg-drop-text"><strong>Upload photo ID</strong></p>
                        <p className="mreg-drop-sub">Passport or driving licences · PDF or image</p>
                      </>
                  }
                  <input ref={idInputRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files[0], setIdDoc)} />
                </div>
              </div>

              {/* Submit */}
              <button className="mreg-submit" onClick={() => alert("Submitting for verification…")}>
                Submit for Verification →
              </button>

              <p className="mreg-login-prompt">
                Already have an account?{" "}
                <button className="mreg-login-link" onClick={() => navigate("/login")}>Log in</button>
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}