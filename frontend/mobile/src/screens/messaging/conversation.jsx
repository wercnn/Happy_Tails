import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./conversation.css";

const NAV = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "pets", emoji: "🐾", label: "My Pets" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

const MOCK_CONVERSATIONS = [
  {
    conversationID: "conv-001",
    userID: "user-101",
    name: "James Walker",
    avatar: "",
    lastMessage: "Hi, I’m available for Buddy on Tuesday at 09:00.",
    timestamp: "09:42",
    unreadCount: 2,
  },
  {
    conversationID: "conv-002",
    userID: "user-102",
    name: "Sophie Bennett",
    avatar: "",
    lastMessage: "Thanks, I’ve accepted the booking request.",
    timestamp: "Yesterday",
    unreadCount: 0,
  },
  {
    conversationID: "conv-003",
    userID: "user-103",
    name: "Oliver Harris",
    avatar: "",
    lastMessage: "Could you let me know if Bella needs medication during the visit?",
    timestamp: "Mon",
    unreadCount: 0,
  },
  {
    conversationID: "conv-004",
    userID: "user-104",
    name: "Emily Carter",
    avatar: "",
    lastMessage: "Perfect — see you at 13:00.",
    timestamp: "Sun",
    unreadCount: 1,
  },
];

function getInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

export default function HappyTailsConversations() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("home");
  const [search, setSearch] = useState("");

  const conversations = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return MOCK_CONVERSATIONS;

    return MOCK_CONVERSATIONS.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.lastMessage.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const handleNavClick = (id) => {
    setActiveNav(id);

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
        conversationID: conversation.conversationID,
        otherUserID: conversation.userID,
        otherUserName: conversation.name,
      },
    });
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="conv-screen">
          <header className="conv-header">
            <button
              className="conv-back-btn"
              type="button"
              onClick={() => navigate("/ownerDash")}
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
              {conversations.length === 0 ? (
                <p className="conv-empty">No conversations found</p>
              ) : (
                conversations.map((conversation) => (
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
                          alt={conversation.name}
                          className="conv-avatar-img"
                        />
                      ) : (
                        <span className="conv-avatar-text">
                          {getInitials(conversation.name)}
                        </span>
                      )}
                    </div>

                    <div className="conv-main">
                      <div className="conv-top-row">
                        <span className="conv-name">{conversation.name}</span>
                        <span className="conv-time">{conversation.timestamp}</span>
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
                ))
              )}
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