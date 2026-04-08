import { useState, useRef } from "react";
import "./UploadPhoto.css";

export default function HappyTailsUploadPhoto() {
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/"))
      setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="up-screen">

          {/* Header */}
          <header className="up-header">
            <button className="up-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="up-title">Upload Pet Photo</h1>
          </header>

          {/* Body */}
          <div className="up-body">

            {/* Drop zone */}
            <div
              className="up-dropzone"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {preview
                ? <img src={preview} alt="Pet preview" className="up-preview" />
                : <>
                    <span className="up-camera-emoji">📷</span>
                    <span className="up-tap-text">Tap to select</span>
                  </>
              }
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            <p className="up-hint">
              Upload a clear photo of your pet.<br />
              JPG, PNG up to 10MB.
            </p>

            <button className="up-upload-btn" onClick={() => fileRef.current?.click()}>
              Upload Photo
            </button>

            <button className="up-skip-btn" onClick={() => alert("Skipped")}>
              Skip For Now
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}