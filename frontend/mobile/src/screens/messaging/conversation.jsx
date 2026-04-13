import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./conversation.css";

const API_BASE = "http://localhost:3000";

const NAV = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "pets", emoji: "🐾", label: "My Pets" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
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

function getOtherPersonName(booking, role) {
  if (role === "owner") {
    const full = [booking.minderFirstName, booking.minderLastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return full || "Pet Minder";
  }

  const full = [booking.ownerFirstName, booking.ownerLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || "Pet Owner";
}

export default function HappyTailsConversations() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("home");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = String(localStorage.getItem("userRole") || "").toLowerCase();

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      setError("");

      try {
        const bookingsRes = await fetch(`${API_BASE}/api/bookings`, {
          headers: getAuthHeaders(),
        });

        const bookingsData = await bookingsRes.json();

        if (!bookingsRes.ok) {
          throw new Error(bookingsData.error || "Failed to load bookings.");
        }

        const bookings = Array.isArray(bookingsData) ? bookingsData : [];

        const conversationResults = await Promise.all(
          bookings.map(async (booking) => {
            try {
              const messagesRes = await fetch(
                `${API_BASE}/api/messages/${booking.bookingID}`,
                {
                  headers: getAuthHeaders(),
                }
              );

              const messagesData = await messagesRes.json();

              if (!messagesRes.ok) {
                return null;
              }

              const messages = Array.isArray(messagesData) ? messagesData : [];
              const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

              return {
                conversationID: booking.bookingID,
                bookingID: booking.bookingID,
                otherUserName: getOtherPersonName(booking, userRole),
                petName: booking.petName || "Pet",
                serviceName: booking.serviceName || "Service",
                avatar: "",
                lastMessage: lastMessage?.content || "No messages yet",
                timestamp: lastMessage?.timestamp || booking.createdAt || booking.startTime,
                rawTimestamp: lastMessage?.timestamp || booking.createdAt || booking.startTime,
                unreadCount: 0,
              };
            } catch {
              return null;
            }
          })
        );

        const cleaned = conversationResults
          .filter(Boolean)
          .filter((item) => item.lastMessage && item.bookingID)
          .sort((a, b) => toDate(b.rawTimestamp) - toDate(a.rawTimestamp));

        setConversations(cleaned);
      } catch (err) {
        console.error("Failed to load conversations:", err);
        setError(err.message || "Failed to load conversations.");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [userRole]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return conversations;

    return conversations.filter((item) => {
      return (
        item.otherUserName.toLowerCase().includes(q) ||
        item.lastMessage.toLowerCase().includes(q) ||
        item.petName.toLowerCase().includes(q) ||
        item.serviceName.toLowerCase().includes(q)
      );
    });
  }, [search, conversations]);

  const handleNavClick = (id) => {
    setActiveNav(id);

    if (userRole === "minder") {
      switch (id) {
        case "home":
          navigate("/mindDash");
          break;
        case "pets":
          navigate("/mindRequests");
          break;
        case "search":
          navigate("/mindAvailability");
          break;
        case "bookings":
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
        bookingID: conversation.bookingID,
        conversationID: conversation.conversationID,
        otherUserName: conversation.otherUserName,
        petName: conversation.petName,
        serviceName: conversation.serviceName,
      },
    });
  };

  const handleBack = () => {
    if (userRole === "minder") {
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
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.conversationID}
                    type="button"
                    className="conv-card"
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
                        <span className="conv-name">{conversation.otherUserName}</span>
                        <span className="conv-time">
                          {formatConversationTime(conversation.timestamp)}
                        </span>
                      </div>

                      <div className="conv-bottom-row">
                        <span className="conv-preview">
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
                ))}
            </div>
          </div>

          <nav className="conv-nav">
            {NAV.map((item) => (
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