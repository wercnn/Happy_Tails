-- =============================================================
-- Happy Tails DBS -- Schema Migration
-- Applies changes to match the frontend mobile and desktop
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1) USER: add account status used by desktop Users page
ALTER TABLE USER
	ADD COLUMN status ENUM('Active', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Active' AFTER phoneNumber;

-- 2) HEALTH_EVENT: update allowed event types
ALTER TABLE HEALTH_EVENT
	MODIFY COLUMN eventType ENUM('Vaccination', 'VetVisit', 'Medication', 'Surgery', 'Dental', 'Other') NOT NULL;

-- 3) MINDER_SERVICE: add minder-specific duration and description
ALTER TABLE MINDER_SERVICE
	ADD COLUMN duration VARCHAR(100) NULL AFTER customPrice,
	ADD COLUMN description TEXT NULL AFTER duration;

-- 4) New table: minder pet-type preferences
CREATE TABLE MINDER_PET_TYPE (
	minderPetTypeID VARCHAR(36)     NOT NULL,
	sitterID        VARCHAR(36)     NOT NULL,
	petType         VARCHAR(50)     NOT NULL,
	CONSTRAINT PK_MINDER_PET_TYPE PRIMARY KEY (minderPetTypeID),
	CONSTRAINT FK_MPT_MINDER FOREIGN KEY (sitterID)
		REFERENCES PET_MINDER (sitterID) ON DELETE CASCADE,
	CONSTRAINT UQ_MINDER_PET_TYPE UNIQUE (sitterID, petType)
);

-- 5) DISPUTE: add dispute type, assignment timestamp, and make employee optional
ALTER TABLE DISPUTE
	MODIFY COLUMN employeeID VARCHAR(36) NULL,
	ADD COLUMN disputeType ENUM('RefundRequest', 'NoShowComplaint', 'ServiceQuality', 'PaymentDispute', 'Other') NOT NULL DEFAULT 'Other' AFTER employeeID,
	ADD COLUMN assignedAt DATETIME NULL AFTER severityLevel;

-- 6) INCIDENT_REPORT: expand incident type taxonomy
ALTER TABLE INCIDENT_REPORT
	MODIFY COLUMN incidentType ENUM('PetInjury', 'PetIllness', 'LostPet', 'MinderNoShow', 'PropertyDamage', 'InappropriateBehaviour', 'Other') NOT NULL DEFAULT 'Other';

-- 7) REVIEW: moderation status
ALTER TABLE REVIEW
	ADD COLUMN status ENUM('Pending', 'Approved', 'Flagged', 'Removed') NOT NULL DEFAULT 'Pending' AFTER comment;

-- 8) New table: platform settings for admin controls
CREATE TABLE PLATFORM_SETTINGS (
	settingID               VARCHAR(36)     NOT NULL,
	platformFeePercent      DECIMAL(5,2)    NOT NULL DEFAULT 5.00,
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

SET FOREIGN_KEY_CHECKS = 1;
