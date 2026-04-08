import { C } from "../../constants.js";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card } from "../../components/card/Card.jsx";
import { Avatar } from "../../components/avatar/Avatar.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./ReportsPage.css";

export default function ReportsPage() {
  const serviceData = [
    { service: "Dog Walking", bookings: 198, revenue: "£7,920", share: 51, barClass: "reports-page__service-fill--orange" },
    { service: "Pet Sitting", bookings: 87, revenue: "£4,350", share: 22, barClass: "reports-page__service-fill--blue" },
    { service: "Home Boarding", bookings: 64, revenue: "£5,120", share: 17, barClass: "reports-page__service-fill--green" },
    { service: "Day Care", bookings: 38, revenue: "£1,900", share: 10, barClass: "reports-page__service-fill--yellow" },
  ];

  const topMinders = [
    { name: "James Walker", bookings: 87, revenue: "£1,740", rating: 4.9, location: "Luton" },
    { name: "Priya Patel", bookings: 54, revenue: "£1,080", rating: 4.7, location: "Luton" },
    { name: "Tom Hughes", bookings: 32, revenue: "£640", rating: 4.8, location: "Bedford" },
    { name: "Emma Reeves", bookings: 28, revenue: "£560", rating: 4.6, location: "Luton" },
  ];

  const monthlyBookings = [
    { m: "Oct", value: 180, heightClass: "reports-page__bar-height--bookings-oct", barClass: "reports-page__bar--orange-mid" },
    { m: "Nov", value: 210, heightClass: "reports-page__bar-height--bookings-nov", barClass: "reports-page__bar--orange-mid" },
    { m: "Dec", value: 290, heightClass: "reports-page__bar-height--bookings-dec", barClass: "reports-page__bar--orange-mid" },
    { m: "Jan", value: 320, heightClass: "reports-page__bar-height--bookings-jan", barClass: "reports-page__bar--orange-mid" },
    { m: "Feb", value: 356, heightClass: "reports-page__bar-height--bookings-feb", barClass: "reports-page__bar--orange-mid" },
    { m: "Mar", value: 387, heightClass: "reports-page__bar-height--bookings-mar", barClass: "reports-page__bar--orange" },
  ];

  const monthlyRevenue = [
    { m: "Oct", value: 9200, heightClass: "reports-page__bar-height--revenue-oct", barClass: "reports-page__bar--green-mid" },
    { m: "Nov", value: 11400, heightClass: "reports-page__bar-height--revenue-nov", barClass: "reports-page__bar--green-mid" },
    { m: "Dec", value: 15600, heightClass: "reports-page__bar-height--revenue-dec", barClass: "reports-page__bar--green-mid" },
    { m: "Jan", value: 16800, heightClass: "reports-page__bar-height--revenue-jan", barClass: "reports-page__bar--green-mid" },
    { m: "Feb", value: 17200, heightClass: "reports-page__bar-height--revenue-feb", barClass: "reports-page__bar--green-mid" },
    { m: "Mar", value: 18340, heightClass: "reports-page__bar-height--revenue-mar", barClass: "reports-page__bar--green" },
  ];

  return (
    <div className="reports-page">
      <SectionHeader
        title="Platform Reports"
        subtitle="Analytics and performance insights for Happy Tails operations"
        action={
          <div className="reports-page__header-actions">
            <Btn variant="outline">📅 Date Range</Btn>
            <Btn variant="primary">Export CSV</Btn>
          </div>
        }
      />

      <div className="reports-page__top-grid">
        <Card>
          <div className="reports-page__card reports-page__card--padded">
            <h3 className="reports-page__card-title">Monthly Bookings</h3>
            <p className="reports-page__card-subtitle">Oct 2025 – Mar 2026</p>

            <div className="reports-page__chart">
              {monthlyBookings.map((d) => (
                <div key={d.m} className="reports-page__chart-col">
                  <div className={`reports-page__chart-bar ${d.barClass} ${d.heightClass}`} />
                  <span className="reports-page__chart-label">{d.m}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="reports-page__card reports-page__card--padded">
            <h3 className="reports-page__card-title">Monthly Revenue (£)</h3>
            <p className="reports-page__card-subtitle">Oct 2025 – Mar 2026</p>

            <div className="reports-page__chart">
              {monthlyRevenue.map((d) => (
                <div key={d.m} className="reports-page__chart-col">
                  <div className={`reports-page__chart-bar ${d.barClass} ${d.heightClass}`} />
                  <span className="reports-page__chart-label">{d.m}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="reports-page__bottom-grid">
        <Card>
          <div className="reports-page__card reports-page__card--padded">
            <h3 className="reports-page__card-title reports-page__card-title--spaced">
              Bookings by Service Type
            </h3>

            {serviceData.map((s) => (
              <div key={s.service} className="reports-page__service-item">
                <div className="reports-page__service-head">
                  <span className="reports-page__service-name">{s.service}</span>

                  <div className="reports-page__service-meta">
                    <span className="reports-page__service-bookings">
                      {s.bookings} bookings
                    </span>
                    <strong className="reports-page__service-revenue">{s.revenue}</strong>
                  </div>
                </div>

                <div className="reports-page__service-track">
                  <div
                    className={`reports-page__service-fill ${s.barClass} reports-page__service-fill--${s.share}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="reports-page__card reports-page__card--padded">
            <h3 className="reports-page__card-title reports-page__card-title--spaced">
              Top Performing Minders
            </h3>

            {topMinders.map((m, i) => (
              <div
                key={m.name}
                className={`reports-page__minder-row ${
                  i < topMinders.length - 1 ? "reports-page__minder-row--bordered" : ""
                }`}
              >
                <div className="reports-page__minder-rank">{i + 1}</div>

                <Avatar name={m.name} size={34} color={C.blue} />

                <div className="reports-page__minder-info">
                  <div className="reports-page__minder-name">{m.name}</div>
                  <div className="reports-page__minder-meta">
                    📍 {m.location} · ⭐ {m.rating}
                  </div>
                </div>

                <div className="reports-page__minder-stats">
                  <div className="reports-page__minder-revenue">{m.revenue}</div>
                  <div className="reports-page__minder-bookings">{m.bookings} bookings</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}