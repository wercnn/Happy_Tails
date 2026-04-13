import { useEffect, useState } from "react";
import { C } from "../../constants.js";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card } from "../../components/card/Card.jsx";
import { Avatar } from "../../components/avatar/Avatar.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./ReportsPage.css";

const API_BASE = "http://localhost:3000";
const API_HEADERS = {
  "Content-Type": "application/json",
  "X-User-Id": "u-support-001",
  "X-User-Role": "support",
};

const SERVICE_COLORS = [
  "reports-page__service-fill--orange",
  "reports-page__service-fill--blue",
  "reports-page__service-fill--green",
  "reports-page__service-fill--yellow",
];

function getDefaultRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 6);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function formatRangeLabel(from, to) {
  const opts = { month: "short", year: "numeric" };
  return `${new Date(from).toLocaleDateString("en-GB", opts)} – ${new Date(to).toLocaleDateString("en-GB", opts)}`;
}

function exportCSV(data, from, to) {
  if (!data) return;
  const rows = [];

  rows.push(`Happy Tails Platform Report,${from} to ${to}`);
  rows.push("");

  rows.push("Monthly Bookings");
  rows.push("Month,Count");
  data.monthlyBookings.forEach((r) => rows.push(`${r.month},${r.count}`));
  rows.push("");

  rows.push("Monthly Revenue");
  rows.push("Month,Revenue (GBP)");
  data.monthlyRevenue.forEach((r) => rows.push(`${r.month},${r.revenue.toFixed(2)}`));
  rows.push("");

  rows.push("Bookings by Service Type");
  rows.push("Service,Bookings,Revenue (GBP),Share (%)");
  data.serviceBreakdown.forEach((r) =>
    rows.push(`${r.service},${r.bookings},${r.revenue.toFixed(2)},${r.share}`)
  );
  rows.push("");

  rows.push("Top Performing Minders");
  rows.push("Name,City,Rating,Bookings,Revenue (GBP)");
  data.topMinders.forEach((r) =>
    rows.push(`"${r.name}",${r.city},${r.rating.toFixed(1)},${r.bookings},${r.revenue.toFixed(2)}`)
  );

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `happy-tails-report-${from}-to-${to}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ReportsPage({ searchQuery = "" }) {
  const defaults = getDefaultRange();

  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo]     = useState(defaults.to);
  const [draftFrom, setDraftFrom] = useState(defaults.from);
  const [draftTo, setDraftTo]     = useState(defaults.to);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const fetchReports = async (from, to) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/reports?from=${from}&to=${to}`,
        { headers: API_HEADERS }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch report data");
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(dateFrom, dateTo);
  }, []);

  const handleApplyDateRange = () => {
    setDateFrom(draftFrom);
    setDateTo(draftTo);
    setShowDatePicker(false);
    fetchReports(draftFrom, draftTo);
  };

  const monthlyBookings  = reportData?.monthlyBookings  ?? [];
  const monthlyRevenue   = reportData?.monthlyRevenue   ?? [];
  const serviceBreakdown = reportData?.serviceBreakdown ?? [];
  const topMinders       = reportData?.topMinders       ?? [];

  const maxBookings = Math.max(...monthlyBookings.map((d) => d.count),   1);
  const maxRevenue  = Math.max(...monthlyRevenue.map((d)  => d.revenue), 1);
  const rangeLabel  = formatRangeLabel(dateFrom, dateTo);

  const visibleMinders = searchQuery
    ? topMinders.filter((m) =>
        [m.name, m.city, m.service]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : topMinders;

  const visibleServices = searchQuery
    ? serviceBreakdown.filter((s) =>
        s.service?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : serviceBreakdown;

  return (
    <div className="reports-page">
      <SectionHeader
        title="Platform Reports"
        subtitle="Analytics and performance insights for Happy Tails operations"
        action={
          <div className="reports-page__header-actions">
            <Btn
              variant="outline"
              onClick={() => {
                setDraftFrom(dateFrom);
                setDraftTo(dateTo);
                setShowDatePicker((v) => !v);
              }}
            >
              📅 Date Range
            </Btn>
            <Btn
              variant="primary"
              disabled={!reportData || loading}
              onClick={() => exportCSV(reportData, dateFrom, dateTo)}
            >
              Export CSV
            </Btn>
          </div>
        }
      />

      {/* ── Date range picker ─────────────────────────── */}
      {showDatePicker && (
        <Card style={{ padding: "14px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
              From
              <input
                type="date"
                value={draftFrom}
                max={draftTo}
                onChange={(e) => setDraftFrom(e.target.value)}
                style={{ padding: "6px 10px", border: "1px solid #e3e8f0", borderRadius: 6, fontSize: 13 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
              To
              <input
                type="date"
                value={draftTo}
                min={draftFrom}
                onChange={(e) => setDraftTo(e.target.value)}
                style={{ padding: "6px 10px", border: "1px solid #e3e8f0", borderRadius: 6, fontSize: 13 }}
              />
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="primary" small onClick={handleApplyDateRange}>Apply</Btn>
              <Btn variant="ghost"   small onClick={() => setShowDatePicker(false)}>Cancel</Btn>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card style={{ padding: "12px 16px", marginBottom: 20, color: "#b91c1c", fontSize: 13 }}>
          {error}
        </Card>
      )}

      {/* ── Top charts ────────────────────────────────── */}
      <div className="reports-page__top-grid">

        {/* Monthly Bookings */}
        <Card>
          <div className="reports-page__card reports-page__card--padded">
            <h3 className="reports-page__card-title">Monthly Bookings</h3>
            <p className="reports-page__card-subtitle">{rangeLabel}</p>

            {loading ? (
              <div style={{ height: 80, display: "flex", alignItems: "center", fontSize: 13, color: "#6b7280" }}>
                Loading...
              </div>
            ) : monthlyBookings.length === 0 ? (
              <div style={{ height: 80, display: "flex", alignItems: "center", fontSize: 13, color: "#6b7280" }}>
                No bookings in this period.
              </div>
            ) : (
              <div className="reports-page__chart">
                {monthlyBookings.map((d, i) => (
                  <div key={d.monthKey} className="reports-page__chart-col">
                    <div
                      className={`reports-page__chart-bar ${
                        i === monthlyBookings.length - 1
                          ? "reports-page__bar--orange"
                          : "reports-page__bar--orange-mid"
                      }`}
                      style={{ height: `${(d.count / maxBookings) * 100}%` }}
                    />
                    <span className="reports-page__chart-label">
                      {d.month.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <div className="reports-page__card reports-page__card--padded">
            <h3 className="reports-page__card-title">Monthly Revenue (£)</h3>
            <p className="reports-page__card-subtitle">{rangeLabel}</p>

            {loading ? (
              <div style={{ height: 80, display: "flex", alignItems: "center", fontSize: 13, color: "#6b7280" }}>
                Loading...
              </div>
            ) : monthlyRevenue.length === 0 ? (
              <div style={{ height: 80, display: "flex", alignItems: "center", fontSize: 13, color: "#6b7280" }}>
                No revenue data in this period.
              </div>
            ) : (
              <div className="reports-page__chart">
                {monthlyRevenue.map((d, i) => (
                  <div key={d.monthKey} className="reports-page__chart-col">
                    <div
                      className={`reports-page__chart-bar ${
                        i === monthlyRevenue.length - 1
                          ? "reports-page__bar--green"
                          : "reports-page__bar--green-mid"
                      }`}
                      style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                    />
                    <span className="reports-page__chart-label">
                      {d.month.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Bottom panels ─────────────────────────────── */}
      <div className="reports-page__bottom-grid">

        {/* Bookings by Service Type */}
        <Card>
          <div className="reports-page__card reports-page__card--padded">
            <h3 className="reports-page__card-title reports-page__card-title--spaced">
              Bookings by Service Type
            </h3>

            {loading ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>Loading...</div>
            ) : visibleServices.length === 0 ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>No data for this period.</div>
            ) : (
              visibleServices.map((s, i) => (
                <div key={s.service} className="reports-page__service-item">
                  <div className="reports-page__service-head">
                    <span className="reports-page__service-name">{s.service}</span>
                    <div className="reports-page__service-meta">
                      <span className="reports-page__service-bookings">
                        {s.bookings} bookings
                      </span>
                      <strong className="reports-page__service-revenue">
                        £{s.revenue.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                  <div className="reports-page__service-track">
                    <div
                      className={`reports-page__service-fill ${SERVICE_COLORS[i % SERVICE_COLORS.length]}`}
                      style={{ width: `${Math.max(s.share, 2)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Top Performing Minders */}
        <Card>
          <div className="reports-page__card reports-page__card--padded">
            <h3 className="reports-page__card-title reports-page__card-title--spaced">
              Top Performing Minders
            </h3>

            {loading ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>Loading...</div>
            ) : visibleMinders.length === 0 ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>No data for this period.</div>
            ) : (
              visibleMinders.map((m, i) => (
                <div
                  key={`${m.name}-${i}`}
                  className={`reports-page__minder-row ${
                    i < topMinders.length - 1 ? "reports-page__minder-row--bordered" : ""
                  }`}
                >
                  <div className="reports-page__minder-rank">{i + 1}</div>

                  <Avatar name={m.name} size={34} color={C.blue} />

                  <div className="reports-page__minder-info">
                    <div className="reports-page__minder-name">{m.name}</div>
                    <div className="reports-page__minder-meta">
                      {m.city && m.city !== "N/A" ? `📍 ${m.city} · ` : ""}
                      ⭐ {m.rating.toFixed(1)}
                    </div>
                  </div>

                  <div className="reports-page__minder-stats">
                    <div className="reports-page__minder-revenue">
                      £{m.revenue.toFixed(2)}
                    </div>
                    <div className="reports-page__minder-bookings">
                      {m.bookings} bookings
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
