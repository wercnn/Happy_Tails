-- =============================================================
-- Happy Tails DBS -- SQL Schema
-- Generated from Logical Model
-- =============================================================

-- =============================================================
-- USER DOMAIN
-- =============================================================

CREATE TABLE IF NOT EXISTS USER (
    userID          VARCHAR(36)     NOT NULL,
    username        VARCHAR(100)    UNIQUE,                          -- #12: nullable; login uses email
    passwordHash    VARCHAR(255)    NOT NULL,
    phoneNumber     VARCHAR(20),
    status          ENUM('Active', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Active',  -- desktop: UsersPage Suspend action
    createdAt       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_USER PRIMARY KEY (userID)
);

CREATE TABLE USER_PROFILE (
    profileID       VARCHAR(36)     NOT NULL,
    userID          VARCHAR(36)     NOT NULL UNIQUE,
    firstName       VARCHAR(100)    NOT NULL,
    lastName        VARCHAR(100)    NOT NULL,
    address         VARCHAR(255),
    city            VARCHAR(100),
    postcode        VARCHAR(20),
    email           VARCHAR(255)    NOT NULL UNIQUE,
    CONSTRAINT PK_USER_PROFILE PRIMARY KEY (profileID),
    CONSTRAINT FK_USER_PROFILE_USER FOREIGN KEY (userID)
        REFERENCES USER (userID) ON DELETE CASCADE
);

CREATE TABLE PROFILE_PHOTO (
    photoID         VARCHAR(36)     NOT NULL,
    profileID       VARCHAR(36)     NOT NULL UNIQUE,
    fileURL         LONGTEXT        NOT NULL,
    uploadedAt      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_PROFILE_PHOTO PRIMARY KEY (photoID),
    CONSTRAINT FK_PROFILE_PHOTO_PROFILE FOREIGN KEY (profileID)
        REFERENCES USER_PROFILE (profileID) ON DELETE CASCADE
);

CREATE TABLE PET_OWNER (
    ownerID         VARCHAR(36)     NOT NULL,
    userID          VARCHAR(36)     NOT NULL UNIQUE,
    CONSTRAINT PK_PET_OWNER PRIMARY KEY (ownerID),
    CONSTRAINT FK_PET_OWNER_USER FOREIGN KEY (userID)
        REFERENCES USER (userID) ON DELETE CASCADE
);

CREATE TABLE PET_MINDER (
    sitterID                VARCHAR(36)     NOT NULL,
    userID                  VARCHAR(36)     NOT NULL UNIQUE,
    bio                     TEXT,
    experienceYears         INT             NOT NULL DEFAULT 0,
    ratingAvg               DECIMAL(3,2)    DEFAULT 0.00,
    overallRating           DECIMAL(3,2)    DEFAULT 0.00,
    medicationQualified     BOOLEAN         NOT NULL DEFAULT FALSE,
    serviceAreaPostcode     VARCHAR(20),                            -- #11: minder's service area postcode
    CONSTRAINT PK_PET_MINDER PRIMARY KEY (sitterID),
    CONSTRAINT FK_PET_MINDER_USER FOREIGN KEY (userID)
        REFERENCES USER (userID) ON DELETE CASCADE
);

CREATE TABLE CUSTOMER_SUPPORT (
    employeeID      VARCHAR(36)     NOT NULL,
    userID          VARCHAR(36)     NOT NULL UNIQUE,
    role            VARCHAR(100)    NOT NULL,
    CONSTRAINT PK_CUSTOMER_SUPPORT PRIMARY KEY (employeeID),
    CONSTRAINT FK_CUSTOMER_SUPPORT_USER FOREIGN KEY (userID)
        REFERENCES USER (userID) ON DELETE CASCADE
);

CREATE TABLE PHONE_VERIFICATION (
    verificationID      VARCHAR(36)     NOT NULL,
    userID              VARCHAR(36)     NOT NULL,
    verificationCode    VARCHAR(100)    NOT NULL,
    dateTimeCode        DATETIME        NOT NULL,
    expiry              DATETIME        NOT NULL,
    status              ENUM('Pending', 'Verified', 'Expired', 'Failed') NOT NULL DEFAULT 'Pending',
    submittedAt         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolvedAt          DATETIME,
    CONSTRAINT PK_PHONE_VERIFICATION PRIMARY KEY (verificationID),
    CONSTRAINT FK_PHONE_VERIFICATION_USER FOREIGN KEY (userID)
        REFERENCES USER (userID) ON DELETE CASCADE
);

CREATE TABLE IDENTITY_VERIFICATION (
    verificationID      VARCHAR(36)     NOT NULL,
    userID              VARCHAR(36)     NOT NULL,
    documentURL         VARCHAR(500),
    status              ENUM('Pending', 'UnderReview', 'Verified', 'Rejected') NOT NULL DEFAULT 'Pending',
    outcome             ENUM('Pending', 'Approved', 'Rejected', 'Denied')      NOT NULL DEFAULT 'Pending',
    submittedAt         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolvedAt          DATETIME,
    CONSTRAINT PK_IDENTITY_VERIFICATION PRIMARY KEY (verificationID),
    CONSTRAINT FK_IDENTITY_VERIFICATION_USER FOREIGN KEY (userID)
        REFERENCES USER (userID) ON DELETE CASCADE
);

CREATE TABLE IDENTITY_DOCUMENT (
    documentID      VARCHAR(36)     NOT NULL,
    verificationID  VARCHAR(36)     NOT NULL,
    documentType    VARCHAR(100)    NOT NULL,
    fileURL         VARCHAR(500)    NOT NULL,
    uploadDate      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_IDENTITY_DOCUMENT PRIMARY KEY (documentID),
    CONSTRAINT FK_IDENTITY_DOCUMENT_VERIFICATION FOREIGN KEY (verificationID)
        REFERENCES IDENTITY_VERIFICATION (verificationID) ON DELETE CASCADE
);

CREATE TABLE NOTIFICATION (
    notificationID  VARCHAR(36)     NOT NULL,
    recipientID     VARCHAR(36)     NOT NULL,
    channel         VARCHAR(50)     NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    body            TEXT,
    isRead          BOOLEAN         NOT NULL DEFAULT FALSE,
    sentAt          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_NOTIFICATION PRIMARY KEY (notificationID),
    CONSTRAINT FK_NOTIFICATION_USER FOREIGN KEY (recipientID)
        REFERENCES USER (userID) ON DELETE CASCADE
);

-- #9: Per-user notification channel preferences
CREATE TABLE NOTIFICATION_PREFERENCE (
    prefID          VARCHAR(36)     NOT NULL,
    userID          VARCHAR(36)     NOT NULL UNIQUE,
    emailEnabled    BOOLEAN         NOT NULL DEFAULT TRUE,
    pushEnabled     BOOLEAN         NOT NULL DEFAULT TRUE,
    smsEnabled      BOOLEAN         NOT NULL DEFAULT FALSE,
    CONSTRAINT PK_NOTIFICATION_PREFERENCE PRIMARY KEY (prefID),
    CONSTRAINT FK_NOTIF_PREF_USER FOREIGN KEY (userID)
        REFERENCES USER (userID) ON DELETE CASCADE
);

-- #8: Saved payment methods per user
CREATE TABLE USER_PAYMENT_METHOD (
    paymentMethodID VARCHAR(36)     NOT NULL,
    userID          VARCHAR(36)     NOT NULL,
    methodType      VARCHAR(50)     NOT NULL,
    displayLabel    VARCHAR(100)    NOT NULL,
    isDefault       BOOLEAN         NOT NULL DEFAULT FALSE,
    addedAt         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_USER_PAYMENT_METHOD PRIMARY KEY (paymentMethodID),
    CONSTRAINT FK_UPM_USER FOREIGN KEY (userID)
        REFERENCES USER (userID) ON DELETE CASCADE
);

-- =============================================================
-- PET DOMAIN
-- =============================================================

CREATE TABLE PET_PROFILE (
    petID       VARCHAR(36)     NOT NULL,
    ownerID     VARCHAR(36)     NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    species     VARCHAR(100)    NOT NULL,
    breed       VARCHAR(100),
    age         INT,
    weight      DECIMAL(5,2),
    neutered    BOOLEAN         NOT NULL DEFAULT FALSE,
    routines    TEXT,
    CONSTRAINT PK_PET_PROFILE PRIMARY KEY (petID),
    CONSTRAINT FK_PET_PROFILE_OWNER FOREIGN KEY (ownerID)
        REFERENCES PET_OWNER (ownerID) ON DELETE CASCADE
);

-- Static health profile (dietary needs, allergies, medication flags)
CREATE TABLE HEALTH_DATA (
    healthID            VARCHAR(36)     NOT NULL,
    petID               VARCHAR(36)     NOT NULL,
    dietaryNeeds        TEXT,
    medications         TEXT,
    vaccinationInfo     TEXT,
    allergies           TEXT,
    requiresMedication  BOOLEAN         NOT NULL DEFAULT FALSE,
    medicalNotes        TEXT,
    vaccinated          BOOLEAN         NOT NULL DEFAULT FALSE,
    updatedAt           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_HEALTH_DATA PRIMARY KEY (healthID),
    CONSTRAINT FK_HEALTH_DATA_PET FOREIGN KEY (petID)
        REFERENCES PET_PROFILE (petID) ON DELETE CASCADE
);

-- #2: Timestamped health event log (matches AddHealthScreen UI)
CREATE TABLE HEALTH_EVENT (
    eventID         VARCHAR(36)     NOT NULL,
    petID           VARCHAR(36)     NOT NULL,
    eventDate       DATE            NOT NULL,
    eventType       ENUM('Vaccination', 'VetVisit', 'Medication', 'Surgery', 'Dental', 'Other') NOT NULL,
    vetClinicName   VARCHAR(255),
    weight          DECIMAL(5,2),
    notes           TEXT,
    recordedAt      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_HEALTH_EVENT PRIMARY KEY (eventID),
    CONSTRAINT FK_HEALTH_EVENT_PET FOREIGN KEY (petID)
        REFERENCES PET_PROFILE (petID) ON DELETE CASCADE
);

CREATE TABLE MEDICAL_DOCUMENT (
    docID       VARCHAR(36)     NOT NULL,
    petID       VARCHAR(36)     NOT NULL,
    fileURL     VARCHAR(500)    NOT NULL,
    fileName    VARCHAR(255)    NOT NULL,
    description TEXT,
    uploadedAt  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_MEDICAL_DOCUMENT PRIMARY KEY (docID),
    CONSTRAINT FK_MEDICAL_DOCUMENT_PET FOREIGN KEY (petID)
        REFERENCES PET_PROFILE (petID) ON DELETE CASCADE
);

CREATE TABLE PET_PHOTO (
    photoID     VARCHAR(36)     NOT NULL,
    petID       VARCHAR(36)     NOT NULL,
    fileURL     LONGTEXT        NOT NULL,
    uploadedAt  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_PET_PHOTO PRIMARY KEY (photoID),
    CONSTRAINT FK_PET_PHOTO_PET FOREIGN KEY (petID)
        REFERENCES PET_PROFILE (petID) ON DELETE CASCADE
);

-- =============================================================
-- BOOKING & SERVICES DOMAIN
-- =============================================================

CREATE TABLE LOCATION (
    locationID  VARCHAR(36)     NOT NULL,
    postcode    VARCHAR(20)     NOT NULL,
    street      VARCHAR(255),
    city        VARCHAR(100),
    county      VARCHAR(100),
    country     VARCHAR(100)    NOT NULL,
    CONSTRAINT PK_LOCATION PRIMARY KEY (locationID)
);

CREATE TABLE SERVICE_TYPE (
    serviceTypeID       VARCHAR(36)     NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    description         TEXT,
    basePrice           DECIMAL(10,2)   NOT NULL,
    rateCode            VARCHAR(50),
    duration            INT             COMMENT 'Duration in minutes',
    supportedPetTypes   VARCHAR(255),
    CONSTRAINT PK_SERVICE_TYPE PRIMARY KEY (serviceTypeID)
);

-- #1: Links a minder to the services they offer with custom price and active toggle
CREATE TABLE MINDER_SERVICE (
    minderServiceID VARCHAR(36)     NOT NULL,
    sitterID        VARCHAR(36)     NOT NULL,
    serviceTypeID   VARCHAR(36)     NOT NULL,
    customPrice     DECIMAL(10,2)   NOT NULL,
    duration        VARCHAR(100),                                   -- minder-specific duration (e.g. "1 hour", "30 mins")
    description     TEXT,                                           -- minder-specific service description (max 250 chars in UI)
    isActive        BOOLEAN         NOT NULL DEFAULT TRUE,
    CONSTRAINT PK_MINDER_SERVICE PRIMARY KEY (minderServiceID),
    CONSTRAINT FK_MS_MINDER FOREIGN KEY (sitterID)
        REFERENCES PET_MINDER (sitterID) ON DELETE CASCADE,
    CONSTRAINT FK_MS_SERVICE FOREIGN KEY (serviceTypeID)
        REFERENCES SERVICE_TYPE (serviceTypeID),
    CONSTRAINT UQ_MINDER_SERVICE UNIQUE (sitterID, serviceTypeID)
);

-- #4-new: Pet types a minder is willing to care for (MinderRegister checkboxes, SearchMinders filter)
CREATE TABLE MINDER_PET_TYPE (
    minderPetTypeID VARCHAR(36)     NOT NULL,
    sitterID        VARCHAR(36)     NOT NULL,
    petType         VARCHAR(50)     NOT NULL,   -- e.g. 'Dogs', 'Cats', 'Reptiles', 'Birds'
    CONSTRAINT PK_MINDER_PET_TYPE PRIMARY KEY (minderPetTypeID),
    CONSTRAINT FK_MPT_MINDER FOREIGN KEY (sitterID)
        REFERENCES PET_MINDER (sitterID) ON DELETE CASCADE,
    CONSTRAINT UQ_MINDER_PET_TYPE UNIQUE (sitterID, petType)
);

CREATE TABLE CALENDAR (
    calendarID  VARCHAR(36)     NOT NULL,
    sitterID    VARCHAR(36)     NOT NULL UNIQUE,
    timeZone    VARCHAR(100)    NOT NULL DEFAULT 'UTC',
    CONSTRAINT PK_CALENDAR PRIMARY KEY (calendarID),
    CONSTRAINT FK_CALENDAR_MINDER FOREIGN KEY (sitterID)
        REFERENCES PET_MINDER (sitterID) ON DELETE CASCADE
);

CREATE TABLE SLOT (
    slotID      VARCHAR(36)     NOT NULL,
    calendarID  VARCHAR(36)     NOT NULL,
    startTime   DATETIME        NOT NULL,
    endTime     DATETIME        NOT NULL,
    isBooked    BOOLEAN         NOT NULL DEFAULT FALSE,
    CONSTRAINT PK_SLOT PRIMARY KEY (slotID),
    CONSTRAINT FK_SLOT_CALENDAR FOREIGN KEY (calendarID)
        REFERENCES CALENDAR (calendarID) ON DELETE CASCADE,
    CONSTRAINT CHK_SLOT_TIMES CHECK (endTime > startTime)
);

-- #10: Recurring weekly availability template (SetAvailabilityScreen day toggles + times)
CREATE TABLE WEEKLY_AVAILABILITY (
    availID     VARCHAR(36)     NOT NULL,
    sitterID    VARCHAR(36)     NOT NULL,
    dayOfWeek   TINYINT         NOT NULL,   -- 0=Mon … 6=Sun
    startTime   TIME            NOT NULL,
    endTime     TIME            NOT NULL,
    CONSTRAINT PK_WEEKLY_AVAILABILITY PRIMARY KEY (availID),
    CONSTRAINT FK_WA_MINDER FOREIGN KEY (sitterID)
        REFERENCES PET_MINDER (sitterID) ON DELETE CASCADE
);

-- #10: One-off blocked dates (SetAvailabilityScreen "Block Out Dates" picker)
CREATE TABLE BLOCKED_DATE (
    blockedID   VARCHAR(36)     NOT NULL,
    sitterID    VARCHAR(36)     NOT NULL,
    blockedDate DATE            NOT NULL,
    CONSTRAINT PK_BLOCKED_DATE PRIMARY KEY (blockedID),
    CONSTRAINT FK_BD_MINDER FOREIGN KEY (sitterID)
        REFERENCES PET_MINDER (sitterID) ON DELETE CASCADE
);

CREATE TABLE BOOKING (
    bookingID           VARCHAR(36)     NOT NULL,
    ownerID             VARCHAR(36)     NOT NULL,
    sitterID            VARCHAR(36)     NOT NULL,
    petID               VARCHAR(36)     NOT NULL,
    slotID              VARCHAR(36)     NOT NULL,
    serviceTypeID       VARCHAR(36)     NOT NULL,
    locationID          VARCHAR(36)     NOT NULL,
    status              VARCHAR(50)     NOT NULL DEFAULT 'Pending',
    startTime           DATETIME        NOT NULL,
    endTime             DATETIME        NOT NULL,
    selectedTime        VARCHAR(20),   -- pet owner's selected time label, e.g. '9:00 AM'
    totalCost           DECIMAL(10,2)   NOT NULL,
    ownerNotes          TEXT,                                       -- #3: owner instructions at booking time
    cancellationReason  VARCHAR(255),                               -- #4: reason selected on CancelBookingScreen
    createdAt           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_BOOKING PRIMARY KEY (bookingID),
    CONSTRAINT FK_BOOKING_OWNER FOREIGN KEY (ownerID)
        REFERENCES PET_OWNER (ownerID),
    CONSTRAINT FK_BOOKING_MINDER FOREIGN KEY (sitterID)
        REFERENCES PET_MINDER (sitterID),
    CONSTRAINT FK_BOOKING_PET FOREIGN KEY (petID)
        REFERENCES PET_PROFILE (petID),
    CONSTRAINT FK_BOOKING_SLOT FOREIGN KEY (slotID)
        REFERENCES SLOT (slotID),
    CONSTRAINT FK_BOOKING_SERVICE FOREIGN KEY (serviceTypeID)
        REFERENCES SERVICE_TYPE (serviceTypeID),
    CONSTRAINT FK_BOOKING_LOCATION FOREIGN KEY (locationID)
        REFERENCES LOCATION (locationID),
    CONSTRAINT CHK_BOOKING_TIMES CHECK (endTime > startTime)
);

CREATE TABLE MEET_AND_GREET (
    meetID                  VARCHAR(36)     NOT NULL,
    bookingID               VARCHAR(36)     NOT NULL UNIQUE,
    scheduledTime           DATETIME        NOT NULL,
    isVirtual               BOOLEAN         NOT NULL DEFAULT FALSE,
    meetingLinkOrLocation   VARCHAR(500),
    status                  ENUM('Pending', 'Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    CONSTRAINT PK_MEET_AND_GREET PRIMARY KEY (meetID),
    CONSTRAINT FK_MAG_BOOKING FOREIGN KEY (bookingID)
        REFERENCES BOOKING (bookingID) ON DELETE CASCADE
);

CREATE TABLE MEET_AND_GREET_NOTE (
    noteID      VARCHAR(36)     NOT NULL,
    meetID      VARCHAR(36)     NOT NULL,
    content     TEXT            NOT NULL,
    createdAt   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_MEET_AND_GREET_NOTE PRIMARY KEY (noteID),
    CONSTRAINT FK_MAG_NOTE_MAG FOREIGN KEY (meetID)
        REFERENCES MEET_AND_GREET (meetID) ON DELETE CASCADE
);

CREATE TABLE VISIT_REPORT (
    reportID            VARCHAR(36)     NOT NULL,
    bookingID           VARCHAR(36)     NOT NULL,
    taskChecklist       TEXT,
    behaviouralNotes    TEXT,
    completedAt         DATETIME,
    timestamp           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_VISIT_REPORT PRIMARY KEY (reportID),
    CONSTRAINT FK_VISIT_REPORT_BOOKING FOREIGN KEY (bookingID)
        REFERENCES BOOKING (bookingID) ON DELETE CASCADE
);


-- =============================================================
-- COMMUNICATION & SUPPORT DOMAIN
-- =============================================================

CREATE TABLE CONVERSATION (
    conversationID  VARCHAR(36)     NOT NULL,
    bookingID       VARCHAR(36)     NULL UNIQUE,
    createdAt       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_CONVERSATION PRIMARY KEY (conversationID),
    CONSTRAINT FK_CONVERSATION_BOOKING FOREIGN KEY (bookingID)
        REFERENCES BOOKING (bookingID) ON DELETE CASCADE
);

CREATE TABLE MESSAGE (
    messageID       VARCHAR(36)     NOT NULL,
    conversationID  VARCHAR(36)     NOT NULL,
    senderUserID    VARCHAR(36)     NOT NULL,
    receiverUserID  VARCHAR(36)     NOT NULL,
    content         TEXT            NOT NULL,
    timestamp       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    isRead          BOOLEAN         NOT NULL DEFAULT FALSE,
    mediaID         VARCHAR(36)     NULL,
    CONSTRAINT PK_MESSAGE PRIMARY KEY (messageID),
    CONSTRAINT FK_MESSAGE_CONVERSATION FOREIGN KEY (conversationID)
        REFERENCES CONVERSATION (conversationID) ON DELETE CASCADE,
    CONSTRAINT FK_MESSAGE_SENDER FOREIGN KEY (senderUserID)
        REFERENCES USER (userID),
    CONSTRAINT FK_MESSAGE_RECEIVER FOREIGN KEY (receiverUserID)
        REFERENCES USER (userID)
);

CREATE TABLE DISPUTE (
    disputeID           VARCHAR(36)     NOT NULL,
    bookingID           VARCHAR(36)     NOT NULL,
    userID              VARCHAR(36)     NOT NULL,
    employeeID          VARCHAR(36)     NULL,                        -- desktop: assigned after creation, starts unassigned
    disputeType         ENUM('RefundRequest', 'NoShowComplaint', 'ServiceQuality', 'PaymentDispute', 'Other') NOT NULL DEFAULT 'Other',  -- desktop: DisputesPage filter/display
    reason              TEXT            NOT NULL,
    status              VARCHAR(50)     NOT NULL DEFAULT 'Open',
    isRefundRequested   BOOLEAN         NOT NULL DEFAULT FALSE,
    resolutionNotes     TEXT,
    severityLevel       ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Low',
    assignedAt          DATETIME,                                    -- desktop: timestamp when employee assigned
    createdAt           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_DISPUTE PRIMARY KEY (disputeID),
    CONSTRAINT FK_DISPUTE_BOOKING FOREIGN KEY (bookingID)
        REFERENCES BOOKING (bookingID),
    CONSTRAINT FK_DISPUTE_USER FOREIGN KEY (userID)
        REFERENCES USER (userID),
    CONSTRAINT FK_DISPUTE_EMPLOYEE FOREIGN KEY (employeeID)
        REFERENCES CUSTOMER_SUPPORT (employeeID)
);

CREATE TABLE INCIDENT_REPORT (
    incidentID      VARCHAR(36)     NOT NULL,
    bookingID       VARCHAR(36)     NOT NULL,
    employeeID      VARCHAR(36)     NOT NULL,
    incidentType    ENUM('PetInjury', 'PetIllness', 'LostPet', 'MinderNoShow', 'PropertyDamage', 'InappropriateBehaviour', 'Other') NOT NULL DEFAULT 'Other',  -- #6
    severityLevel   ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Low',
    description     TEXT            NOT NULL,
    reportedAt      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('Open', 'Escalated', 'Resolved') NOT NULL DEFAULT 'Open',
    reporterUserID  VARCHAR(36)     NULL,                        -- #7: userID of the minder who filed the report (nullable for employee-filed reports)
    caseReference   VARCHAR(20)     NULL,                        -- short reference shown on confirmation screen e.g. #INC-XXXXXXXX
    CONSTRAINT PK_INCIDENT_REPORT PRIMARY KEY (incidentID),
    CONSTRAINT FK_INCIDENT_BOOKING FOREIGN KEY (bookingID)
        REFERENCES BOOKING (bookingID),
    CONSTRAINT FK_INCIDENT_EMPLOYEE FOREIGN KEY (employeeID)
        REFERENCES CUSTOMER_SUPPORT (employeeID),
    CONSTRAINT FK_INCIDENT_REPORTER FOREIGN KEY (reporterUserID)
        REFERENCES USER (userID) ON DELETE SET NULL
);

-- ALTER TABLE INCIDENT_REPORT
--   ADD COLUMN caseReference VARCHAR(20) NULL
--     COMMENT 'Short case reference shown on confirmation screen e.g. #INC-XXXXXXXX';

-- #7: MEDIA linked to VISIT_REPORT, MESSAGE, and INCIDENT_REPORT
CREATE TABLE MEDIA (
    mediaID     VARCHAR(36)     NOT NULL,
    reportID    VARCHAR(36)     NULL,
    messageID   VARCHAR(36)     NULL,
    incidentID  VARCHAR(36)     NULL,                               -- #7: link media to incident reports
    fileURL     VARCHAR(500)    NOT NULL,
    mediaType   VARCHAR(50)     NOT NULL,
    timestamp   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_MEDIA PRIMARY KEY (mediaID),
    CONSTRAINT FK_MEDIA_REPORT FOREIGN KEY (reportID)
        REFERENCES VISIT_REPORT (reportID) ON DELETE SET NULL,
    CONSTRAINT FK_MEDIA_MESSAGE FOREIGN KEY (messageID)
        REFERENCES MESSAGE (messageID) ON DELETE SET NULL,
    CONSTRAINT FK_MEDIA_INCIDENT FOREIGN KEY (incidentID)
        REFERENCES INCIDENT_REPORT (incidentID) ON DELETE SET NULL
);


CREATE TABLE PAYMENT (
    paymentID       VARCHAR(36)     NOT NULL,
    bookingID       VARCHAR(36)     NOT NULL UNIQUE,
    serviceCost     DECIMAL(10,2)   NOT NULL,                       -- #5: base cost before platform fee
    platformFee     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,          -- #5: platform fee (e.g. 5%)
    amount          DECIMAL(10,2)   NOT NULL,                       -- total = serviceCost + platformFee
    paymentMethod   VARCHAR(50)     NOT NULL,
    paidAt          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paymentStatus   VARCHAR(50)     NOT NULL DEFAULT 'Pending',
    escrowStatus    ENUM('Holding', 'Released', 'Refunded') NOT NULL DEFAULT 'Holding',
    CONSTRAINT PK_PAYMENT PRIMARY KEY (paymentID),
    CONSTRAINT FK_PAYMENT_BOOKING FOREIGN KEY (bookingID)
        REFERENCES BOOKING (bookingID) ON DELETE CASCADE
);

CREATE TABLE REFUND (
    refundID    VARCHAR(36)     NOT NULL,
    paymentID   VARCHAR(36)     NOT NULL,
    amount      DECIMAL(10,2)   NOT NULL,
    reason      TEXT            NOT NULL,
    refundedAt  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_REFUND PRIMARY KEY (refundID),
    CONSTRAINT FK_REFUND_PAYMENT FOREIGN KEY (paymentID)
        REFERENCES PAYMENT (paymentID) ON DELETE CASCADE
);

CREATE TABLE REVIEW (
    reviewID        VARCHAR(36)     NOT NULL,
    bookingID       VARCHAR(36)     NOT NULL,
    reviewerUserID  VARCHAR(36)     NOT NULL,
    rating          INT             NOT NULL,
    comment         TEXT,
    status          ENUM('Pending', 'Approved', 'Flagged', 'Removed') NOT NULL DEFAULT 'Pending',  -- desktop: ReviewsPage moderation states
    createdAt       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_REVIEW PRIMARY KEY (reviewID),
    CONSTRAINT FK_REVIEW_BOOKING FOREIGN KEY (bookingID)
        REFERENCES BOOKING (bookingID) ON DELETE CASCADE,
    CONSTRAINT FK_REVIEW_USER FOREIGN KEY (reviewerUserID)
        REFERENCES USER (userID),
    CONSTRAINT CHK_REVIEW_RATING CHECK (rating BETWEEN 1 AND 5)
);

-- =============================================================
-- REVIEW_FLAG (referenced by reviews.js routes)
-- =============================================================

CREATE TABLE REVIEW_FLAG (
    flagID          VARCHAR(36)     NOT NULL,
    reviewID        VARCHAR(36)     NOT NULL,
    flaggerUserID   VARCHAR(36)     NOT NULL,
    reason          TEXT,
    status          ENUM('Open', 'Resolved', 'Dismissed') NOT NULL DEFAULT 'Open',
    createdAt       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_REVIEW_FLAG PRIMARY KEY (flagID),
    CONSTRAINT FK_RF_REVIEW FOREIGN KEY (reviewID)
        REFERENCES REVIEW (reviewID) ON DELETE CASCADE,
    CONSTRAINT FK_RF_USER FOREIGN KEY (flaggerUserID)
        REFERENCES USER (userID) ON DELETE CASCADE
);


-- =============================================================
-- PLATFORM SETTINGS (desktop: SettingsPage configuration)
-- =============================================================

CREATE TABLE PLATFORM_SETTINGS (
    settingID               VARCHAR(36)     NOT NULL,
    platformFeePercent      DECIMAL(5,2)    NOT NULL DEFAULT 5.00,  -- used in booking cost calc
    escrowReleaseDays       INT             NOT NULL DEFAULT 1,
    refundWindowDays        INT             NOT NULL DEFAULT 14,
    stripeMode              ENUM('Live', 'Test') NOT NULL DEFAULT 'Test',
    sessionTimeoutMins      INT             NOT NULL DEFAULT 30,
    twoFAEnabled            BOOLEAN         NOT NULL DEFAULT TRUE,
    auditLogRetentionDays   INT             NOT NULL DEFAULT 365,
    gdprMode                BOOLEAN         NOT NULL DEFAULT FALSE,
    emailNotifications      BOOLEAN         NOT NULL DEFAULT TRUE,
    smsNotifications        BOOLEAN         NOT NULL DEFAULT FALSE,
    bookingReminders        BOOLEAN         NOT NULL DEFAULT TRUE,
    incidentAlerts          BOOLEAN         NOT NULL DEFAULT TRUE,
    updatedAt               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_PLATFORM_SETTINGS PRIMARY KEY (settingID)
);
