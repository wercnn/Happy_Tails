import { useState } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./ReviewsPage.css";

export default function ReviewsPage() {
  const [selectedReview, setSelectedReview] = useState(null);

  const reviews = [
    {
      id: "#RV-291",
      owner: "Sarah J.",
      minder: "James W.",
      rating: 5,
      text: "James is absolutely fantastic with Buddy. So reliable!",
      booking: "#HT-8798",
      date: "3 Apr",
      status: "approved",
    },
    {
      id: "#RV-290",
      owner: "Mike T.",
      minder: "Priya P.",
      rating: 4,
      text: "Great service, good communication throughout.",
      booking: "#HT-8780",
      date: "1 Apr",
      status: "approved",
    },
    {
      id: "#RV-281",
      owner: "Chris L.",
      minder: "Tom H.",
      rating: 1,
      text: "This minder is a complete fraud and lied about [abusive]",
      booking: "#HT-8797",
      date: "29 Mar",
      status: "flagged",
    },
    {
      id: "#RV-285",
      owner: "Anna B.",
      minder: "James W.",
      rating: 5,
      text: "Buddy was so happy when I came back. Would absolutely book again.",
      booking: "#HT-8770",
      date: "25 Mar",
      status: "approved",
    },
  ];

  const statCards = [
    {
      icon: "⭐",
      label: "Avg. Rating",
      value: "4.7",
      iconClass: "reviews-page__stat-icon-box--yellow",
      valueClass: "reviews-page__stat-value--yellow",
    },
    {
      icon: "✅",
      label: "Approved",
      value: "284",
      iconClass: "reviews-page__stat-icon-box--green",
      valueClass: "reviews-page__stat-value--green",
    },
    {
      icon: "🚩",
      label: "Flagged",
      value: "7",
      iconClass: "reviews-page__stat-icon-box--red",
      valueClass: "reviews-page__stat-value--red",
    },
    {
      icon: "⏳",
      label: "Pending",
      value: "12",
      iconClass: "reviews-page__stat-icon-box--orange",
      valueClass: "reviews-page__stat-value--orange",
    },
  ];

  return (
    <div className="reviews-page">
      <SectionHeader
        title="Reviews & Ratings"
        subtitle="Moderate platform reviews and manage flagged content (RQ17, 50, 51)"
      />

      <div className="reviews-page__stats-grid">
        {statCards.map((item) => (
          <Card key={item.label}>
            <div className="reviews-page__stat-card">
              <div className={`reviews-page__stat-icon-box ${item.iconClass}`}>
                {item.icon}
              </div>

              <div className="reviews-page__stat-content">
                <p className="reviews-page__stat-label">{item.label}</p>
                <p className={`reviews-page__stat-value ${item.valueClass}`}>
                  {item.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <table className="reviews-page__table">
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Owner</Th>
              <Th>Minder</Th>
              <Th>Rating</Th>
              <Th>Review</Th>
              <Th>Booking</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>

          <tbody>
            {reviews.map((r) => (
              <tr
                key={r.id}
                className={
                  r.status === "flagged"
                    ? "reviews-page__row reviews-page__row--flagged"
                    : "reviews-page__row"
                }
              >
                <Td>
                  <span className="reviews-page__id">{r.id}</span>
                </Td>

                <Td>{r.owner}</Td>
                <Td>{r.minder}</Td>

                <Td>
                  <span className="reviews-page__rating">
                    {"⭐".repeat(r.rating)}
                  </span>
                </Td>

                <Td>
                  <span
                    className={
                      r.status === "flagged"
                        ? "reviews-page__review-text reviews-page__review-text--flagged"
                        : "reviews-page__review-text"
                    }
                  >
                    {r.text}
                  </span>
                </Td>

                <Td>
                  <span className="reviews-page__booking">{r.booking}</span>
                </Td>

                <Td>
                  <span className="reviews-page__date">{r.date}</span>
                </Td>

                <Td>
                  <StatusBadge status={r.status} />
                </Td>

                <Td>
                  {r.status === "flagged" ? (
                    <div className="reviews-page__actions">
                      <Btn variant="success" small>
                        Approve
                      </Btn>
                      <Btn variant="danger" small>
                        Remove
                      </Btn>
                      <Btn variant="outline" small onClick={() => setSelectedReview(r)}>
                        View
                      </Btn>
                    </div>
                  ) : (
                    <Btn variant="outline" small onClick={() => setSelectedReview(r)}>
                      View
                    </Btn>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {selectedReview && (
        <div
          className="reviews-page__overlay"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="reviews-page__overlay-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="reviews-page__overlay-close"
              onClick={() => setSelectedReview(null)}
            >
              ✕
            </button>

            <div className="reviews-page__overlay-header">
              <div className="reviews-page__overlay-header-main">
                <p className="reviews-page__overlay-id">{selectedReview.id}</p>
                <h2 className="reviews-page__overlay-title">Review Details</h2>
                <p className="reviews-page__overlay-subtitle">
                  {selectedReview.date} · {selectedReview.booking}
                </p>
                <div className="reviews-page__overlay-badges">
                  <StatusBadge status={selectedReview.status} />
                </div>
              </div>
            </div>

            <div className="reviews-page__overlay-grid">
              <div className="reviews-page__overlay-section">
                <h3 className="reviews-page__overlay-section-title">Review Info</h3>

                <div className="reviews-page__overlay-list">
                  <div className="reviews-page__overlay-row">
                    <span>Owner</span>
                    <strong>{selectedReview.owner}</strong>
                  </div>
                  <div className="reviews-page__overlay-row">
                    <span>Minder</span>
                    <strong>{selectedReview.minder}</strong>
                  </div>
                  <div className="reviews-page__overlay-row">
                    <span>Booking</span>
                    <strong>{selectedReview.booking}</strong>
                  </div>
                  <div className="reviews-page__overlay-row">
                    <span>Rating</span>
                    <strong>{"⭐".repeat(selectedReview.rating)}</strong>
                  </div>
                  <div className="reviews-page__overlay-row">
                    <span>Date</span>
                    <strong>{selectedReview.date}</strong>
                  </div>
                </div>
              </div>

              <div className="reviews-page__overlay-section">
                <h3 className="reviews-page__overlay-section-title">Review Text</h3>

                <div className="reviews-page__overlay-note-box">
                  <p
                    className={`reviews-page__overlay-note-text ${
                      selectedReview.status === "flagged"
                        ? "reviews-page__overlay-note-text--flagged"
                        : ""
                    }`}
                  >
                    {selectedReview.text}
                  </p>
                </div>

                <div className="reviews-page__overlay-stats">
                  <div className="reviews-page__overlay-stat">
                    <span className="reviews-page__overlay-stat-label">Status</span>
                    <strong className="reviews-page__overlay-stat-value">
                      {selectedReview.status}
                    </strong>
                  </div>
                  <div className="reviews-page__overlay-stat">
                    <span className="reviews-page__overlay-stat-label">Score</span>
                    <strong className="reviews-page__overlay-stat-value">
                      {selectedReview.rating}/5
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="reviews-page__overlay-actions">
              {selectedReview.status === "flagged" && (
                <>
                  <Btn variant="success">Approve Review</Btn>
                  <Btn variant="danger">Remove Review</Btn>
                </>
              )}
              <Btn variant="outline">View Booking</Btn>
              <Btn variant="outline">Contact User</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}