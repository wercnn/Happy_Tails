import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./conversation.css";

const API_BASE = "http://localhost:3000";

const OWNER_NAV = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "pets", emoji: "🐾", label: "My Pets" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

const MINDER_NAV = [
  { id: "dashboard", emoji: "🏠", label: "Dashboard" },
  { id: "services", emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests", emoji: "📬", label: "Requests" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "x-user-id": localStorage.getItem("userID") || "",
    "x-user-role": localStorage.getItem("userRole") || "",
  };
}

function getInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function toDate(dateStr) {
  return new Date(String(dateStr).replace(" ", "T"));
}

function formatConversationTime(dateStr) {
  if (!dateStr) return "";

  const date = toDate(dateStr);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function HappyTailsConversations() {
  const navigate = useNavigate();
  const userRole = String(localStorage.getItem("userRole") || "").toLowerCase();

  const isMinder = userRole === "minder";
  const navItems = isMinder ? MINDER_NAV : OWNER_NAV;

  const [activeNav, setActiveNav] = useState(isMinder ? "dashboard" : "home");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/messages/conversations`, {
          headers: getAuthHeaders(),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load conversations.");
        }

        setConversations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load conversations:", err);
        setError(err.message || "Failed to load conversations.");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return conversations;

    return conversations.filter((item) => {
      return (
        String(item.otherUserName || "").toLowerCase().includes(q) ||
        String(item.lastMessage || "").toLowerCase().includes(q)
      );
    });
  }, [search, conversations]);

  const handleNavClick = (id) => {
    setActiveNav(id);

    if (isMinder) {
      switch (id) {
        case "dashboard":
          navigate("/mindDash");
          break;
        case "services":
          navigate("/mindService");
          break;
        case "availability":
          navigate("/mindAvailability");
          break;
        case "requests":
          navigate("/mindRequests");
          break;
        case "profile":
          navigate("/profile");
          break;
        default:
          break;
      }
      return;
    }

    switch (id) {
      case "home":
        navigate("/ownerDash");
        break;
      case "pets":
        navigate("/ownerPets");
        break;
      case "search":
        navigate("/ownerSearch");
        break;
      case "bookings":
        navigate("/ownerBooking");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        break;
    }
  };

  const handleOpenConversation = (conversation) => {
    navigate("/chat", {
      state: {
        otherUserID: conversation.otherUserID,
        otherUserName: conversation.otherUserName,
        conversationID: conversation.conversationID,
      },
    });
  };

  const handleBack = () => {
    if (isMinder) {
      navigate("/mindDash");
    } else {
      navigate("/ownerDash");
    }
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="conv-screen">
          <header className="conv-header">
            <button
              className="conv-back-btn"
              type="button"
              onClick={handleBack}
            >
              ←
            </button>
            <h1 className="conv-title">Messages</h1>
          </header>

          <div className="conv-search-wrap">
            <div className="conv-search-box">
              <span className="conv-search-icon">🔍</span>
              <input
                className="conv-search-input"
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="conv-scroll">
            <div className="conv-list">
              {loading && <p className="conv-empty">Loading conversations...</p>}
              {!loading && error && <p className="conv-empty">{error}</p>}

              {!loading && !error && filteredConversations.length === 0 && (
                <p className="conv-empty">No conversations found</p>
              )}

              {!loading &&
                !error &&
                filteredConversations.map((conversation) => {
                  const isUnread = Number(conversation.unreadCount || 0) > 0;

                  return (
                    <button
                      key={conversation.conversationKey || conversation.conversationID}
                      type="button"
                      className={`conv-card${isUnread ? " conv-card--unread" : ""}`}
                      onClick={() => handleOpenConversation(conversation)}
                    >
                      <div className="conv-avatar">
                        {conversation.avatar ? (
                          <img
                            src={conversation.avatar}
                            alt={conversation.otherUserName}
                            className="conv-avatar-img"
                          />
                        ) : (
                          <span className="conv-avatar-text">
                            {getInitials(conversation.otherUserName)}
                          </span>
                        )}
                      </div>

                      <div className="conv-main">
                        <div className="conv-top-row">
                          <div className="conv-name-wrap">
                            <span className={`conv-name${isUnread ? " conv-name--unread" : ""}`}>
                              {conversation.otherUserName}
                            </span>
                            {isUnread && <span className="conv-blue-dot" />}
                          </div>

                          <span className="conv-time">
                            {formatConversationTime(conversation.timestamp)}
                          </span>
                        </div>

                        <div className="conv-bottom-row">
                          <span
                            className={`conv-preview${isUnread ? " conv-preview--unread" : ""}`}
                          >
                            {conversation.lastMessage}
                          </span>

                          {conversation.unreadCount > 0 && (
                            <span className="conv-unread">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          <nav className="conv-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`conv-nav-item${activeNav === item.id ? " conv-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
                type="button"
              >
                <span className="conv-nav-emoji">{item.emoji}</span>
                <span className="conv-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}