import { useState, useEffect } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./ReviewsPage.css";

const API = "http://localhost:3000/api";

export default function ReviewsPage({ user }) {
  const safeUser = user || {
    userID: "u-support-001",
    role: "support",
  };

  function headers() {
    return {
      "Content-Type": "application/json",
      "X-User-Id": safeUser.userID,
      "X-User-Role": safeUser.role,
    };
  }

  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ FETCH REVIEWS
  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/reviews`, { headers: headers() });
      const data = await res.json();
      setReviews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ✅ ACTIONS
  async function approveReview(id) {
    await fetch(`${API}/reviews/${id}/approve`, {
      method: "PATCH",
      headers: headers(),
    });
    fetchReviews();
  }

  async function removeReview(id) {
    await fetch(`${API}/reviews/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    fetchReviews();
  }

  // ✅ STATS
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((s, r) => s + Number(r.rating || 0), 0) /
          reviews.length
        ).toFixed(1)
      : "0";

  const approved = reviews.filter((r) => r.status === "approved").length;
  const flagged = reviews.filter((r) => r.status === "flagged").length;
  const pending = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="reviews-page">
      <SectionHeader title="Reviews & Ratings" />

      {/* STATS */}
      <div className="reviews-page__stats-grid">
        <Card>Avg Rating: {avgRating}</Card>
        <Card>Approved: {approved}</Card>
        <Card>Flagged: {flagged}</Card>
        <Card>Pending: {pending}</Card>
      </div>

      {/* TABLE */}
      <Card>
        {loading ? (
          <p>Loading reviews...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>User</Th>
                <Th>Rating</Th>
                <Th>Review</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody>
              {reviews.map((r) => (
                <tr key={r.reviewID}>
                  <Td>{r.reviewID}</Td>
                  <Td>{r.userID}</Td>
                  <Td>{"⭐".repeat(r.rating || 0)}</Td>
                  <Td>{r.comment}</Td>
                  <Td>
                    <StatusBadge status={r.status?.toLowerCase()} />
                  </Td>
                  <Td>
                    {r.status === "flagged" && (
                      <>
                        <Btn onClick={() => approveReview(r.reviewID)}>
                          Approve
                        </Btn>
                        <Btn onClick={() => removeReview(r.reviewID)}>
                          Remove
                        </Btn>
                      </>
                    )}
                    <Btn onClick={() => setSelectedReview(r)}>View</Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* MODAL */}
      {selectedReview && (
        <div onClick={() => setSelectedReview(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3>{selectedReview.reviewID}</h3>
            <p>User: {selectedReview.userID}</p>
            <p>Rating: {selectedReview.rating}</p>
            <p>{selectedReview.comment}</p>

            <Btn onClick={() => setSelectedReview(null)}>Close</Btn>
          </div>
        </div>
      )}
    </div>
  );
}