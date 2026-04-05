import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Filters.css";

const SERVICE_TYPES = ["All", "Dog Walking", "Boarding", "Pet Sitting", "Day Care"];
const PET_TYPES = ["All", "Dogs", "Cats", "Rabbits", "Birds"];
const AVAILABILITY = ["Any", "Today", "This Week", "Weekends Only"];
const SORT_OPTIONS = ["Nearest First", "Highest Rated", "Lowest Price", "Most Reviews"];

const DEFAULT_FILTERS = {
  services: ["All"],
  pets: ["All"],
  availability: ["Any"],
  maxPrice: 25,
  sortBy: "Nearest First",
};

export default function HappyTailsFilters() {
  const navigate = useNavigate();
  const location = useLocation();

  const incomingFilters = location.state?.filters || DEFAULT_FILTERS;

  const [services, setServices] = useState(incomingFilters.services);
  const [pets, setPets] = useState(incomingFilters.pets);
  const [availability, setAvailability] = useState(incomingFilters.availability);
  const [maxPrice, setMaxPrice] = useState(incomingFilters.maxPrice);
  const [sortBy, setSortBy] = useState(incomingFilters.sortBy);
  const [sortOpen, setSortOpen] = useState(false);

  const toggle = (val, list, setter, exclusive = ["All", "Any"]) => {
    if (exclusive.includes(val)) {
      setter([val]);
    } else {
      setter((prev) => {
        const withoutExclusive = prev.filter((x) => !exclusive.includes(x));

        const updated = withoutExclusive.includes(val)
          ? withoutExclusive.filter((x) => x !== val)
          : [...withoutExclusive, val];

        return updated.length > 0 ? updated : [exclusive[0]];
      });
    }
  };

  const applyFilters = () => {
    navigate("/ownerSearch", {
      state: {
        filters: {
          services,
          pets,
          availability,
          maxPrice,
          sortBy,
        },
      },
    });
  };

  const clearAll = () => {
    setServices(["All"]);
    setPets(["All"]);
    setAvailability(["Any"]);
    setMaxPrice(25);
    setSortBy("Nearest First");
    setSortOpen(false);
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="flt-screen">
          <div className="flt-handle" />

          <div className="flt-scroll">
            <div className="flt-body">
              <h1 className="flt-heading">Filters &amp; Sort</h1>

              <section className="flt-section">
                <label className="flt-section-label">Service Type</label>
                <div className="flt-chips">
                  {SERVICE_TYPES.map((s) => (
                    <button
                      key={s}
                      className={`flt-chip${services.includes(s) ? " flt-chip--active" : ""}`}
                      onClick={() => toggle(s, services, setServices, ["All"])}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>

              <section className="flt-section">
                <label className="flt-section-label">Pet Type</label>
                <div className="flt-chips">
                  {PET_TYPES.map((p) => (
                    <button
                      key={p}
                      className={`flt-chip${pets.includes(p) ? " flt-chip--active" : ""}`}
                      onClick={() => toggle(p, pets, setPets, ["All"])}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </section>

              <section className="flt-section">
                <label className="flt-section-label">Availability</label>
                <div className="flt-chips">
                  {AVAILABILITY.map((a) => (
                    <button
                      key={a}
                      className={`flt-chip${availability.includes(a) ? " flt-chip--active" : ""}`}
                      onClick={() => toggle(a, availability, setAvailability, ["Any"])}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </section>

              <section className="flt-section">
                <label className="flt-section-label">Max Price (per hour)</label>
                <div className="flt-slider-wrap">
                  <input
                    type="range"
                    className="flt-slider"
                    min={5}
                    max={50}
                    step={1}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    style={{ "--pct": `${((maxPrice - 5) / 45) * 100}%` }}
                  />
                  <div className="flt-slider-labels">
                    <span>£5</span>
                    <span className="flt-slider-value">Up to £{maxPrice}</span>
                    <span>£50</span>
                  </div>
                </div>
              </section>

              <section className="flt-section">
                <label className="flt-section-label">Sort By</label>
                <div className="flt-select-wrap">
                  <button
                    className="flt-select-btn"
                    onClick={() => setSortOpen((o) => !o)}
                  >
                    <span>{sortBy}</span>
                    <span className={`flt-select-arrow${sortOpen ? " flt-select-arrow--open" : ""}`}>
                      ▼
                    </span>
                  </button>

                  {sortOpen && (
                    <div className="flt-dropdown">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          className={`flt-dropdown-item${sortBy === opt ? " flt-dropdown-item--active" : ""}`}
                          onClick={() => {
                            setSortBy(opt);
                            setSortOpen(false);
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="flt-footer">
            <button className="flt-apply-btn" onClick={applyFilters}>
              APPLY FILTERS
            </button>
            <button className="flt-clear-btn" onClick={clearAll}>
              CLEAR ALL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}