import "./MinderProfile.css";

const MINDER = {
  name: "James Walker",
  verified: true,
  location: "Luton · 0.8 mi away",
  services_tags: ["Dog Walking", "Boarding"],
  stats: [
    { emoji: "⭐", value: "4.9", label: "Rating" },
    { emoji: "📋", value: "87",  label: "Bookings" },
    { emoji: "🏅", value: "3 yrs", label: "Experience" },
  ],
  services: [
    { name: "Dog Walking (30 min)", price: "£15",       unit: "" },
    { name: "Dog Walking (60 min)", price: "£22",       unit: "" },
    { name: "Overnight Boarding",   price: "£35",       unit: "/night" },
  ],
  reviews: [
    {
      id: 1,
      reviewer: "Sarah J.",
      stars: 5,
      text: "James is brilliant with Buddy! So reliable and caring.",
    },
    {
      id: 2,
      reviewer: "Mike T.",
      stars: 4,
      text: "Great service, always punctual and communicates well.",
    },
  ],
};

function Stars({ count }) {
  return (
    <span className="mp-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < count ? "mp-star mp-star--filled" : "mp-star"}>★</span>
      ))}
    </span>
  );
}

export default function HappyTailsMinderProfile() {
  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="mp-screen">

          {/* Orange Header */}
          <header className="mp-header">
            <div className="mp-header-top">
              <button className="mp-back" onClick={() => alert("Go back")}>←</button>
              <span className="mp-header-title">Minder Profile</span>
            </div>

            <div className="mp-hero">
              <div className="mp-avatar">🐾</div>
              <div className="mp-hero-info">
                <div className="mp-name-row">
                  <h1 className="mp-name">{MINDER.name}</h1>
                  <span className="mp-verified">✔</span>
                </div>
                <p className="mp-location">📍 {MINDER.location}</p>
                <div className="mp-tags">
                  {MINDER.services_tags.map((t) => (
                    <span key={t} className="mp-tag">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Body */}
          <div className="mp-scroll">
            <div className="mp-body">

              {/* Stats */}
              <div className="mp-stats-row">
                {MINDER.stats.map((s) => (
                  <div key={s.label} className="mp-stat-card">
                    <span className="mp-stat-emoji">{s.emoji}</span>
                    <span className="mp-stat-value">{s.value}</span>
                    <span className="mp-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Services & Pricing */}
              <section className="mp-section">
                <h2 className="mp-section-title">Services &amp; Pricing</h2>
                <div className="mp-service-list">
                  {MINDER.services.map((svc) => (
                    <div key={svc.name} className="mp-service-row">
                      <span className="mp-service-name">{svc.name}</span>
                      <span className="mp-service-price">{svc.price}{svc.unit}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Reviews */}
              <section className="mp-section">
                <h2 className="mp-section-title">Reviews</h2>
                <div className="mp-review-list">
                  {MINDER.reviews.map((r) => (
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

          {/* Sticky Book Now */}
          <div className="mp-footer">
            <button className="mp-book-btn" onClick={() => alert("Book James Walker!")}>
              BOOK NOW →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}