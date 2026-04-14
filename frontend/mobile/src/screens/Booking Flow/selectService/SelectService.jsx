import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SelectService.css";

const API_BASE = "http://localhost:3000";

const getServiceEmoji = (serviceName) => {
  const lower = (serviceName || "").toLowerCase();

  if (lower.includes("walk")) return "🚶";
  if (lower.includes("board")) return "🏠";
  if (lower.includes("sit")) return "🐾";
  if (lower.includes("day")) return "☀️";
  return "🐾";
};

export default function HappyTailsSelectService() {
  const navigate = useNavigate();
  const location = useLocation();

  const minder = location.state?.minder || null;
  const returnToSummary = Boolean(location.state?.returnToSummary);

  const [selected, setSelected] = useState(null);
  const [fullMinder, setFullMinder] = useState(minder);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(minder));
  const [error, setError] = useState("");

  useEffect(() => {
    const sitterID = minder?.sitterID || minder?.id;
    if (!sitterID) {
      setIsLoading(false);
      return;
    }

    const loadMinderServices = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/minders/${sitterID}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": localStorage.getItem("userID") || "",
            "x-user-role": localStorage.getItem("userRole") || "",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load services.");
          return;
        }

        setFullMinder(data);

        const activeServices = (data.services || [])
          .filter((service) => service.isActive !== false)
          .map((service) => ({
            id: service.minderServiceID || service.serviceTypeID,
            minderServiceID: service.minderServiceID || null,
            serviceTypeID: service.serviceTypeID || null,
            emoji: getServiceEmoji(service.name),
            name: service.name,
            description: service.description || "",
            customPrice: service.customPrice ?? null,
            basePrice: service.basePrice ?? null,
            price:
              service.customPrice != null
                ? `£${service.customPrice}`
                : service.basePrice != null
                  ? `£${service.basePrice}`
                  : "Price unavailable",
            unit: "/hr",
            raw: service,
          }));

        setServices(activeServices);

        const existingService =
          location.state?.service?.minderServiceID ||
          location.state?.service?.serviceTypeID ||
          location.state?.service?.id ||
          null;

        if (existingService) {
          const matched = activeServices.find(
            (svc) =>
              svc.id === existingService ||
              svc.minderServiceID === existingService ||
              svc.serviceTypeID === existingService
          );
          if (matched) {
            setSelected(matched.id);
          }
        }
      } catch (err) {
        console.error("Failed to load minder services:", err);
        setError("Server error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadMinderServices();
  }, [minder, location.state]);

  const handleBack = () => {
    if (returnToSummary) {
      navigate("/bookingSummary", {
        state: {
          ...location.state,
          minder: fullMinder || minder,
        },
      });
      return;
    }

    if (minder) {
      navigate("/viewMinders", { state: { minder: fullMinder || minder } });
      return;
    }

    navigate("/ownerSearch");
  };

  const handleContinue = () => {
    if (!selected) return;

    const selectedService = services.find((svc) => svc.id === selected);
    if (!selectedService) return;

    if (returnToSummary) {
      navigate("/bookingSummary", {
        state: {
          ...location.state,
          minder: fullMinder || minder,
          service: selectedService,
        },
      });
      return;
    }

    navigate("/selectDates", {
      state: {
        minder: fullMinder || minder,
        service: selectedService,
      },
    });
  };

  const minderName =
    fullMinder?.name ||
    `${fullMinder?.firstName || ""} ${fullMinder?.lastName || ""}`.trim() ||
    minder?.name ||
    "this minder";

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="ss-screen">
          <header className="ss-header">
            <button className="ss-back" onClick={handleBack} type="button">
              ←
            </button>
            <h1 className="ss-title">Select Service</h1>
          </header>

          <div className="ss-scroll">
            <div className="ss-body">
              <p className="ss-subtitle">
                Choose a service from <strong>{minderName}</strong>
              </p>

              {isLoading && <p className="ss-subtitle">Loading services...</p>}
              {error && <p className="ss-subtitle">{error}</p>}

              <div className="ss-list">
                {!isLoading &&
                  !error &&
                  services.map((svc) => (
                    <button
                      key={svc.id}
                      className={`ss-card${selected === svc.id ? " ss-card--selected" : ""}`}
                      onClick={() => setSelected(svc.id)}
                      type="button"
                    >
                      <span className="ss-card-emoji">{svc.emoji}</span>
                      <div className="ss-card-info">
                        <span className="ss-card-name">{svc.name}</span>
                        <span className="ss-card-price">
                          {svc.price}
                          {svc.unit}
                        </span>
                      </div>
                      <span className={`ss-radio${selected === svc.id ? " ss-radio--active" : ""}`} />
                    </button>
                  ))}

                {!isLoading && !error && services.length === 0 && (
                  <p className="ss-subtitle">This minder has no services listed yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="ss-footer">
            <button
              className={`ss-continue-btn${!selected ? " ss-continue-btn--disabled" : ""}`}
              onClick={handleContinue}
              disabled={!selected}
              type="button"
            >
              {returnToSummary ? "SAVE CHANGES →" : "CONTINUE →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}