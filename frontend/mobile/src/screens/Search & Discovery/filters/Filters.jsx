import { useState } from "react";
import "./Filters.css";

const SERVICE_TYPES = ["All", "Dog Walking", "Boarding", "Pet Sitting", "Day Care"];
const PET_TYPES     = ["All", "Dogs", "Cats", "Rabbits", "Birds"];
const AVAILABILITY  = ["Any", "Today", "This Week", "Weekends Only"];
const SORT_OPTIONS  = ["Nearest First", "Highest Rated", "Lowest Price", "Most Reviews"];

export default function HappyTailsFilters() {
  const [services,      setServices]      = useState(["All"]);
  const [pets,          setPets]          = useState(["All"]);
  const [availability,  setAvailability]  = useState(["Any"]);
  const [maxPrice,      setMaxPrice]      = useState(25);
  const [sortBy,        setSortBy]        = useState("Nearest First");
  const [sortOpen,      setSortOpen]      = useState(false);

  const toggle = (val, list, setter, exclusive = ["All", "Any"]) => {
    if (exclusive.includes(val)) {
      setter([val]);
    } else {
      setter((prev) => {
        const without = prev.filter((x) => !exclusive.includes(x));
        return without.includes(val)
          ? without.filter((x) => x !== val) || [exclusive[0]]
          : [...without, val];
      });
    }
  };

  const applyFilters = () => alert("Filters applied!");
  const clearAll = () => {
    setServices(["All"]);
    setPets(["All"]);
    setAvailability(["Any"]);
    setMaxPrice(25);
    setSortBy("Nearest First");
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="flt-screen">

          {/* Drag handle */}
          <div className="flt-handle" />

          <div className="flt-scroll">
            <div className="flt-body">

              <h1 className="flt-heading">Filters &amp; Sort</h1>

              {/* Service Type */}
              <section className="flt-section">
                <label className="flt-section-label">Service Type</label>
                <div className="flt-chips">
                  {SERVICE_TYPES.map((s) => (
                    <button
                      key={s}
                      className={`flt-chip${services.includes(s) ? " flt-chip--active" : ""}`}
                      onClick={() => toggle(s, services, setServices, ["All"])}
                    >{s}</button>
                  ))}
                </div>
              </section>

              {/* Pet Type */}
              <section className="flt-section">
                <label className="flt-section-label">Pet Type</label>
                <div className="flt-chips">
                  {PET_TYPES.map((p) => (
                    <button
                      key={p}
                      className={`flt-chip${pets.includes(p) ? " flt-chip--active" : ""}`}
                      onClick={() => toggle(p, pets, setPets, ["All"])}
                    >{p}</button>
                  ))}
                </div>
              </section>

              {/* Availability */}
              <section className="flt-section">
                <label className="flt-section-label">Availability</label>
                <div className="flt-chips">
                  {AVAILABILITY.map((a) => (
                    <button
                      key={a}
                      className={`flt-chip${availability.includes(a) ? " flt-chip--active" : ""}`}
                      onClick={() => toggle(a, availability, setAvailability, ["Any"])}
                    >{a}</button>
                  ))}
                </div>
              </section>

              {/* Max Price */}
              <section className="flt-section">
                <label className="flt-section-label">Max Price (per hour)</label>
                <div className="flt-slider-wrap">
                  <input
                    type="range"
                    className="flt-slider"
                    min={5} max={50} step={1}
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

              {/* Sort By */}
              <section className="flt-section">
                <label className="flt-section-label">Sort By</label>
                <div className="flt-select-wrap">
                  <button
                    className="flt-select-btn"
                    onClick={() => setSortOpen((o) => !o)}
                  >
                    <span>{sortBy}</span>
                    <span className={`flt-select-arrow${sortOpen ? " flt-select-arrow--open" : ""}`}>▼</span>
                  </button>
                  {sortOpen && (
                    <div className="flt-dropdown">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          className={`flt-dropdown-item${sortBy === opt ? " flt-dropdown-item--active" : ""}`}
                          onClick={() => { setSortBy(opt); setSortOpen(false); }}
                        >{opt}</button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

            </div>
          </div>

          {/* Footer actions */}
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