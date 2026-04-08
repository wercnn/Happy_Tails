import { useLocation, useNavigate } from "react-router-dom";
import "./MinderProfile.css";

function Stars({ count }) {
  return (
    <span className="mp-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < count ? "mp-star mp-star--filled" : "mp-star"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function HappyTailsMinderProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const minder = location.state?.minder;

  if (!minder) {
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

  const profile = {
    name: minder.name,
    location: `${minder.distance} away`,
    services_tags: minder.serviceList || [],
    stats: [
      { emoji: "⭐", value: String(minder.ratingText || minder.rating || "N/A"), label: "Rating" },
      { emoji: "📋", value: String(minder.reviews || 0), label: "Reviews" },
      { emoji: "🏅", value: "3 yrs", label: "Experience" },
    ],
    services: (minder.serviceList || []).map((service) => ({
      name: service,
      price: `£${minder.price ?? ""}`,
      unit: "/hr",
    })),
    reviews: [
      {
        id: 1,
        reviewer: "Sarah J.",
        stars: 5,
        text: `${minder.name} is reliable, caring, and great with pets.`,
      },
      {
        id: 2,
        reviewer: "Mike T.",
        stars: 4,
        text: "Great communication and very trustworthy.",
      },
    ],
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
              <div className="mp-avatar">{minder.emoji || "🐾"}</div>
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
                  {profile.services.map((svc) => (
                    <div key={svc.name} className="mp-service-row">
                      <span className="mp-service-name">{svc.name}</span>
                      <span className="mp-service-price">{svc.price}{svc.unit}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mp-section">
                <h2 className="mp-section-title">Reviews</h2>
                <div className="mp-review-list">
                  {profile.reviews.map((r) => (
                    <div key={r.id} className="mp-review-card">
                      <div className="mp-review-top">
                        <span className="mp-reviewer">{r.reviewer}</span>
                        <Stars count={r.stars} />
                      </div>
                      <p className="mp-review-text">{r.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="mp-footer">
            <button
              className="mp-book-btn"
              onClick={() => navigate("/selectService", { state: { minder } })}
            >
              BOOK NOW →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}