import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MinderProfile.css";

function Stars({ count }) {
  const rounded = Math.round(Number(count) || 0);

  return (
    <span className="mp-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rounded ? "mp-star mp-star--filled" : "mp-star"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function HappyTailsMinderProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const minderFromState = location.state?.minder || null;
  const storedSitterID = localStorage.getItem("selectedMinderID") || "";
  const initialSitterID =
    minderFromState?.sitterID || minderFromState?.id || storedSitterID;

  const [fullMinder, setFullMinder] = useState(minderFromState);
  const [isLoading, setIsLoading] = useState(Boolean(initialSitterID));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialSitterID) {
      setIsLoading(false);
      setError("Please go back and select a minder again.");
      return;
    }

    const loadMinder = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/minders/${initialSitterID}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": localStorage.getItem("userID") || "",
            "x-user-role": localStorage.getItem("userRole") || "",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load minder profile.");
          return;
        }

        setFullMinder(data);
        localStorage.setItem("selectedMinderID", data.sitterID || initialSitterID);
      } catch (err) {
        console.error("Failed to load minder profile:", err);
        setError("Server error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadMinder();
  }, [initialSitterID]);

  if (!initialSitterID && !isLoading) {
    return (
      <div className="mobile-stage">
        <div className="mobile-frame">
          <div className="mp-screen">
            <header className="mp-header">
              <div className="mp-header-top">
                <button className="mp-back" onClick={() => navigate("/ownerSearch")}>
                  ←
                </button>
                <span className="mp-header-title">Minder Profile</span>
              </div>

              <div className="mp-hero">
                <div className="mp-avatar">🐾</div>
                <div className="mp-hero-info">
                  <h1 className="mp-name">Minder not found</h1>
                  <p className="mp-location">Please go back and select a minder again.</p>
                </div>
              </div>
            </header>
          </div>
        </div>
      </div>
    );
  }

  const displayMinder = fullMinder || minderFromState || {};
  const name =
    displayMinder.name ||
    `${displayMinder.firstName || ""} ${displayMinder.lastName || ""}`.trim() ||
    "Minder";

  const locationText =
    displayMinder.distance
      ? `${displayMinder.distance} away`
      : displayMinder.city || displayMinder.postcode || "Location unavailable";

  const rating = Number(displayMinder.ratingAvg || 0).toFixed(1);
  const reviews = displayMinder.reviews || [];
  const reviewCount = Array.isArray(reviews)
    ? reviews.length
    : Number(displayMinder.reviews || 0);

  const services =
    Array.isArray(displayMinder.services) && displayMinder.services.length > 0
      ? displayMinder.services
      : [];

  const tags =
    Array.isArray(displayMinder.serviceList) && displayMinder.serviceList.length > 0
      ? displayMinder.serviceList
      : services.map((s) => s.name);

  const profile = {
    name,
    location: locationText,
    services_tags: tags,
    stats: [
      { emoji: "⭐", value: rating ? rating : "N/A", label: "Rating" },
      { emoji: "📋", value: String(reviewCount), label: "Reviews" },
      {
        emoji: "🏅",
        value: `${displayMinder.experienceYears || 0} yrs`,
        label: "Experience",
      },
    ],
    services: services.map((service) => ({
      id: service.minderServiceID || service.serviceTypeID || service.name,
      name: service.name,
      price:
        service.customPrice != null
          ? `£${service.customPrice}`
          : service.basePrice != null
          ? `£${service.basePrice}`
          : "Price unavailable",
      unit: service.customPrice != null || service.basePrice != null ? "/hr" : "",
    })),
    reviews: Array.isArray(reviews)
      ? reviews.map((review) => ({
          id: review.reviewID || review.id,
          reviewer: review.reviewerName || "Happy Tails User",
          stars: Number(review.rating || 0),
          text: review.comment || "No written review provided.",
        }))
      : [],
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="mp-screen">
          <header className="mp-header">
            <div className="mp-header-top">
              <button className="mp-back" onClick={() => navigate("/ownerSearch")}>
                ←
              </button>
              <span className="mp-header-title">Minder Profile</span>
            </div>

            <div className="mp-hero">
              <div className="mp-avatar">{displayMinder.emoji || "🐾"}</div>
              <div className="mp-hero-info">
                <div className="mp-name-row">
                  <h1 className="mp-name">{profile.name}</h1>
                </div>
                <p className="mp-location">📍 {profile.location}</p>
                <div className="mp-tags">
                  {profile.services_tags.map((t) => (
                    <span key={t} className="mp-tag">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <div className="mp-scroll">
            <div className="mp-body">
              {isLoading && <p className="mp-review-text">Loading minder profile...</p>}
              {error && <p className="mp-review-text">{error}</p>}

              <div className="mp-stats-row">
                {profile.stats.map((s) => (
                  <div key={s.label} className="mp-stat-card">
                    <span className="mp-stat-emoji">{s.emoji}</span>
                    <span className="mp-stat-value">{s.value}</span>
                    <span className="mp-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>

              <section className="mp-section">
                <h2 className="mp-section-title">Services &amp; Pricing</h2>
                <div className="mp-service-list">
                  {profile.services.length > 0 ? (
                    profile.services.map((svc) => (
                      <div key={svc.id} className="mp-service-row">
                        <span className="mp-service-name">{svc.name}</span>
                        <span className="mp-service-price">
                          {svc.price}{svc.unit}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="mp-review-text">No services listed yet.</p>
                  )}
                </div>
              </section>

              <section className="mp-section">
                <h2 className="mp-section-title">Reviews</h2>
                <div className="mp-review-list">
                  {profile.reviews.length > 0 ? (
                    profile.reviews.map((r) => (
                      <div key={r.id} className="mp-review-card">
                        <div className="mp-review-top">
                          <span className="mp-reviewer">{r.reviewer}</span>
                          <Stars count={r.stars} />
                        </div>
                        <p className="mp-review-text">{r.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="mp-review-text">No reviews yet.</p>
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="mp-footer">
            <button
              className="mp-book-btn"
              onClick={() =>
                navigate("/selectService", {
                  state: { minder: displayMinder },
                })
              }
            >
              BOOK NOW →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}