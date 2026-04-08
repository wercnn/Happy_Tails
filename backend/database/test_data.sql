-- =============================================================
-- TEST DATA
-- Three accounts: sarah (owner), james (minder), emma (support)
-- All passwords: test1234
-- Password hash format: salt_hex:scrypt_derived_key_hex
-- Regenerate with:
--   node -e "const c=require('crypto');const s=c.randomBytes(16).toString('hex');
--            c.scrypt('test1234',s,64,(e,k)=>console.log(s+':'+k.toString('hex')));"
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─── Users ───────────────────────────────────────────────────
INSERT INTO USER (userID, username, passwordHash, phoneNumber) VALUES
  ('u-owner-001',  'sarah_o',  'happytails-fixed-salt:b9d4820593b7d18f366c8f50478d3610bdd0f2cd70913c4a928a087892adce30b0ac6518780ba134c0eadefaf88b90579d2a85ef30d99ff58487a975ac01cc8b', '07700900001'),
  ('u-minder-001', 'james_m',  'happytails-fixed-salt:b9d4820593b7d18f366c8f50478d3610bdd0f2cd70913c4a928a087892adce30b0ac6518780ba134c0eadefaf88b90579d2a85ef30d99ff58487a975ac01cc8b', '07700900002'),
  ('u-minder-002', 'olivia_m', 'happytails-fixed-salt:b9d4820593b7d18f366c8f50478d3610bdd0f2cd70913c4a928a087892adce30b0ac6518780ba134c0eadefaf88b90579d2a85ef30d99ff58487a975ac01cc8b', '07700900004'),
  ('u-support-001','emma_s',   'happytails-fixed-salt:b9d4820593b7d18f366c8f50478d3610bdd0f2cd70913c4a928a087892adce30b0ac6518780ba134c0eadefaf88b90579d2a85ef30d99ff58487a975ac01cc8b', '07700900003');

-- If these users already exist in the database, run this instead of re-seeding.
UPDATE USER
SET passwordHash = 'happytails-fixed-salt:b9d4820593b7d18f366c8f50478d3610bdd0f2cd70913c4a928a087892adce30b0ac6518780ba134c0eadefaf88b90579d2a85ef30d99ff58487a975ac01cc8b'
WHERE userID IN ('u-owner-001', 'u-minder-001', 'u-minder-002', 'u-support-001');

-- ─── User Profiles ───────────────────────────────────────────
INSERT INTO USER_PROFILE (profileID, userID, firstName, lastName, address, city, postcode, email) VALUES
  ('pr-owner-001',  'u-owner-001',  'Sarah',  'Thompson', '12 Maple Street', 'London', 'E1 6RF', 'sarah@example.com'),
  ('pr-minder-001', 'u-minder-001', 'James',  'Carter',   '8 Oak Avenue',    'London', 'E2 7JT', 'james@example.com'),
  ('pr-minder-002', 'u-minder-002', 'Olivia', 'Bennett',  '21 Birch Road',   'London', 'E3 4AB', 'olivia@example.com'),
  ('pr-support-001','u-support-001','Emma',   'Clarke',   NULL,              'London', NULL,     'emma@example.com');

-- ─── Role Tables ─────────────────────────────────────────────
INSERT INTO PET_OWNER (ownerID, userID) VALUES
  ('own-001', 'u-owner-001');

INSERT INTO PET_MINDER (sitterID, userID, bio, experienceYears, ratingAvg, overallRating, medicationQualified, serviceAreaPostcode) VALUES
  ('sit-001', 'u-minder-001',
   'Experienced dog walker and boarder. I have cared for over 50 dogs and hold a pet first-aid certificate.',
   4, 4.80, 4.80, TRUE, 'E2'),
  ('sit-002', 'u-minder-002',
   'Calm and reliable minder with experience in cat care, puppy routines, and administering oral medication.',
   6, 4.90, 4.90, TRUE, 'E3');

INSERT INTO CUSTOMER_SUPPORT (employeeID, userID, role) VALUES
  ('emp-001', 'u-support-001', 'Support');

-- ─── Identity Verification ───────────────────────────────────
INSERT INTO IDENTITY_VERIFICATION (verificationID, userID, documentURL, status, outcome, submittedAt, resolvedAt) VALUES
  ('iv-001', 'u-minder-001',  'https://example.com/docs/james-id.pdf', 'UnderReview', 'Pending',  '2026-05-01 09:30:00', NULL),
  ('iv-002', 'u-owner-001',   'https://example.com/docs/sarah-id.pdf', 'Pending',     'Pending',  '2026-05-03 14:15:00', NULL),
  ('iv-003', 'u-support-001', 'https://example.com/docs/emma-id.pdf',  'Verified',    'Approved', '2026-04-20 11:00:00', '2026-04-21 16:45:00');

-- ─── Pet Profile ─────────────────────────────────────────────
INSERT INTO PET_PROFILE (petID, ownerID, name, species, breed, age, weight, neutered, routines) VALUES
  ('pet-001', 'own-001', 'Buddy', 'Dog', 'Golden Retriever', 3, 28.50, TRUE,
   'Morning walk at 8am. Dinner at 6pm. Loves fetch. Nervous around large dogs — keep on lead.');

-- ─── Service Types ───────────────────────────────────────────
INSERT INTO SERVICE_TYPE (serviceTypeID, name, description, basePrice, rateCode, duration, supportedPetTypes) VALUES
  ('st-walk',    'Dog Walking',  '30-minute local walk, solo or small group.',       15.00, 'WALK_30',     30,   'Dog'),
  ('st-board',   'Pet Boarding', 'Overnight stay at the minder\'s home.',            45.00, 'BOARD_NIGHT', 1440, 'Dog,Cat'),
  ('st-daycare', 'Dog Daycare',  'Full day of play and care at the minder\'s home.', 30.00, 'DAYCARE_DAY', 480,  'Dog');

-- ─── Minder Services ─────────────────────────────────────────
INSERT INTO MINDER_SERVICE (minderServiceID, sitterID, serviceTypeID, customPrice, isActive) VALUES
  ('ms-001', 'sit-001', 'st-walk',    18.00, TRUE),
  ('ms-002', 'sit-001', 'st-board',   50.00, TRUE),
  ('ms-003', 'sit-002', 'st-walk',    20.00, TRUE),
  ('ms-004', 'sit-002', 'st-daycare', 34.00, TRUE);

-- ─── Calendars & Slots ───────────────────────────────────────
INSERT INTO CALENDAR (calendarID, sitterID, timeZone) VALUES
  ('cal-001', 'sit-001', 'Europe/London'),
  ('cal-002', 'sit-002', 'Europe/London');

-- slot-001: booked (used by bk-001 completed booking)
-- slot-002: booked (used by bk-002 pending booking)
-- slot-003: free   (available for new booking tests)
-- slot-004/005: free (sit-002 availability)
INSERT INTO SLOT (slotID, calendarID, startTime, endTime, isBooked) VALUES
  ('slot-001', 'cal-001', '2026-05-10 09:00:00', '2026-05-10 10:00:00', TRUE),
  ('slot-002', 'cal-001', '2026-05-12 09:00:00', '2026-05-12 10:00:00', TRUE),
  ('slot-003', 'cal-001', '2026-05-15 14:00:00', '2026-05-15 15:00:00', FALSE),
  ('slot-004', 'cal-002', '2026-05-16 10:00:00', '2026-05-16 11:00:00', FALSE),
  ('slot-005', 'cal-002', '2026-05-18 15:00:00', '2026-05-18 16:00:00', FALSE);

-- ─── Location ────────────────────────────────────────────────
INSERT INTO LOCATION (locationID, postcode, street, city, county, country) VALUES
  ('loc-001', 'E1 6RF', '12 Maple Street', 'London', 'Greater London', 'UK');

-- ─── Bookings ────────────────────────────────────────────────
-- bk-001: completed — used for payment, visit report, review, messages, incident
-- bk-002: pending  — for testing accept / reject / cancel
INSERT INTO BOOKING (bookingID, ownerID, sitterID, petID, slotID, serviceTypeID, locationID,
                     status, startTime, endTime, totalCost, ownerNotes) VALUES
  ('bk-001', 'own-001', 'sit-001', 'pet-001', 'slot-001', 'st-walk', 'loc-001',
   'completed', '2026-05-10 09:00:00', '2026-05-10 10:00:00', 18.00,
   'Please keep Buddy on the lead at all times. He is friendly but nervous around big dogs.'),
  ('bk-002', 'own-001', 'sit-001', 'pet-001', 'slot-002', 'st-walk', 'loc-001',
   'pending',    '2026-05-12 09:00:00', '2026-05-12 10:00:00', 18.00, NULL);

-- ─── Payment ─────────────────────────────────────────────────
INSERT INTO PAYMENT (paymentID, bookingID, serviceCost, platformFee, amount,
                     paymentMethod, paymentStatus, escrowStatus) VALUES
  ('pay-001', 'bk-001', 18.00, 0.90, 18.90, 'card', 'Released', 'Released');

-- ─── Visit Report ─────────────────────────────────────────────
INSERT INTO VISIT_REPORT (reportID, bookingID, taskChecklist, behaviouralNotes, completedAt) VALUES
  ('vr-001', 'bk-001',
   'Fed: Yes | Walk completed: Yes | Medication: N/A | Water: Yes',
   'Buddy was energetic and playful throughout. No issues. He enjoyed the park.',
   '2026-05-10 10:05:00');

-- ─── Incident Report ─────────────────────────────────────────
INSERT INTO INCIDENT_REPORT (incidentID, bookingID, employeeID, reporterUserID, incidentType, severityLevel, description) VALUES
  ('inc-001', 'bk-001', 'emp-001', 'u-minder-001', 'Other', 'Low',
   'Buddy briefly slipped his collar during the walk but was recovered immediately. No injury. Owner notified.');

-- ─── Review ──────────────────────────────────────────────────
INSERT INTO REVIEW (reviewID, bookingID, reviewerUserID, rating, comment) VALUES
  ('rev-001', 'bk-001', 'u-owner-001', 5,
   'James was absolutely wonderful with Buddy! Very professional, caring and communicative. Will definitely book again.');

-- ─── Review Flag ─────────────────────────────────────────────
INSERT INTO REVIEW_FLAG (flagID, reviewID, flaggerUserID, reason, status) VALUES
  ('rf-001', 'rev-001', 'u-minder-001', 'Testing the flag workflow — not a real dispute.', 'Open');

-- ─── Conversation & Messages ─────────────────────────────────
INSERT INTO CONVERSATION (conversationID, bookingID) VALUES
  ('conv-001', 'bk-001');

INSERT INTO MESSAGE (messageID, conversationID, senderUserID, receiverUserID, content) VALUES
  ('msg-001', 'conv-001', 'u-owner-001',  'u-minder-001',
   'Hi James! Just a reminder that Buddy gets nervous around big dogs. Please keep him on the lead.'),
  ('msg-002', 'conv-001', 'u-minder-001', 'u-owner-001',
   'Of course Sarah, I will keep Buddy safe and comfortable the whole time. Will send an update after!'),
  ('msg-003', 'conv-001', 'u-minder-001', 'u-owner-001',
   'Walk done! Buddy was a star. He loved sniffing around the park. All good here.');

-- ─── Dispute ─────────────────────────────────────────────────
INSERT INTO DISPUTE (disputeID, bookingID, userID, employeeID, disputeType, reason,
                     status, isRefundRequested, resolutionNotes, severityLevel, assignedAt, createdAt) VALUES
  ('disp-001', 'bk-001', 'u-owner-001', 'emp-001', 'ServiceQuality',  'Review flag escalated to dispute for resolution.',        'Open',     FALSE, NULL,                                    'Medium', NOW(), NOW()),
  ('disp-002', 'bk-001', 'u-owner-001', NULL,      'RefundRequest',   'Service quality concerns regarding pet care standards.',  'Open',     TRUE,  NULL,                                    'High',   NULL,  NOW()),
  ('disp-003', 'bk-002', 'u-owner-001', NULL,      'PaymentDispute',  'Payment discrepancy for daycare service.',                'Pending',  TRUE,  NULL,                                    'Medium', NULL,  NOW()),
  ('disp-004', 'bk-002', 'u-owner-001', 'emp-001', 'NoShowComplaint', 'Scheduling conflict and cancellation policy dispute.',    'Resolved', FALSE, 'Issue resolved by support after case review.', 'Low', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
