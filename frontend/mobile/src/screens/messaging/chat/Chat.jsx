import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Chat.css";

const API_BASE = "http://localhost:3000";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "x-user-id": localStorage.getItem("userID") || "",
    "x-user-role": localStorage.getItem("userRole") || "",
  };
}

function toDate(dateStr) {
  return new Date(String(dateStr).replace(" ", "T"));
}

function formatMessageTime(dateStr) {
  if (!dateStr) return "";
  return toDate(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatChatDate(dateStr) {
  if (!dateStr) return "";
  return toDate(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isSameDay(a, b) {
  const d1 = toDate(a);
  const d2 = toDate(b);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function buildChatItems(messages) {
  const items = [];

  messages.forEach((message, index) => {
    const prev = messages[index - 1];

    if (!prev || !isSameDay(prev.timestamp, message.timestamp)) {
      items.push({
        type: "date",
        id: `date-${message.messageID || index}`,
        label: formatChatDate(message.timestamp),
      });
    }

    items.push({
      type: "message",
      ...message,
    });
  });

  return items;
}

export default function HappyTailsChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const bottomRef = useRef(null);

  const bookingID = location.state?.bookingID || null;
  const sitterID = location.state?.sitterID || null;
  const otherUserName = location.state?.otherUserName || "Conversation";
  const petName = location.state?.petName || "";
  const serviceName = location.state?.serviceName || "";

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const currentUserID = localStorage.getItem("userID") || "";

  const chatItems = useMemo(() => buildChatItems(messages), [messages]);

  const fetchMessages = async () => {
    if (!bookingID && !sitterID) {
      setMessages([]);
      setLoading(false);
      setError("Missing conversation details.");
      return;
    }

    try {
      setError("");

      const url = bookingID
        ? `${API_BASE}/api/messages/${bookingID}`
        : `${API_BASE}/api/messages/direct/${sitterID}`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load messages.");
      }

      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError(err.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingID, sitterID]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatItems, loading]);

  const handleSendMessage = async () => {
    const trimmed = messageText.trim();

    if (!trimmed || sending) return;

    if (!bookingID && !sitterID) {
      setError("Missing conversation details.");
      return;
    }

    try {
      setSending(true);
      setError("");

      const payload = {
        content: trimmed,
      };

      if (bookingID) {
        payload.bookingID = bookingID;
      } else {
        payload.sitterID = sitterID;
      }

      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setMessages((prev) => [...prev, data]);
      setMessageText("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="chat-screen">
          <header className="chat-header">
            <button className="chat-back-btn" type="button" onClick={handleBack}>
              ←
            </button>

            <div className="chat-header-info">
              <h1 className="chat-title">{otherUserName}</h1>
              {(petName || serviceName) && (
                <p className="chat-subtitle">
                  {[petName, serviceName].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </header>

          <div className="chat-scroll">
            <div className="chat-body">
              {loading && <p className="chat-empty">Loading messages...</p>}

              {!loading && error && <p className="chat-empty">{error}</p>}

              {!loading && !error && chatItems.length === 0 && (
                <p className="chat-empty">No messages yet. Start the conversation.</p>
              )}

              {!loading &&
                !error &&
                chatItems.map((item) => {
                  if (item.type === "date") {
                    return (
                      <div key={item.id} className="chat-date-divider">
                        <span className="chat-date-pill">{item.label}</span>
                      </div>
                    );
                  }

                  const isMine = String(item.senderUserID) === String(currentUserID);

                  return (
                    <div
                      key={item.messageID}
                      className={`chat-row${isMine ? " chat-row--mine" : ""}`}
                    >
                      <div
                        className={`chat-bubble${
                          isMine ? " chat-bubble--mine" : " chat-bubble--theirs"
                        }`}
                      >
                        <p className="chat-message-text">{item.content}</p>
                        <span className="chat-message-time">
                          {formatMessageTime(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}

              <div ref={bottomRef} />
            </div>
          </div>

          <div className="chat-footer">
            <div className="chat-input-wrap">
              <textarea
                className="chat-input"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />

              <button
                className="chat-send-btn"
                type="button"
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sending}
              >
                {sending ? "..." : "➤"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}