-- Dealer Desk - Clean standalone MySQL 8 schema
-- Separate from the large mercuryevtech_erp legacy dump.
-- Use this only for the Dealer Desk application.

CREATE DATABASE IF NOT EXISTS dealer_desk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dealer_desk;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS audit_logs, sync_changes, notifications, timeline_events, visit_outcomes, visits, request_notes, request_lines, request_field_values, requests, request_status_transitions, request_statuses, request_fields, request_types, prospect_onboarding_items, prospect_stage_history, prospects, dealer_contacts, dealers, services, service_providers, document_types, visit_types, territories, tiers, staff_permissions, staff_roles, roles, refresh_tokens, staff;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE staff (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(150) NOT NULL,
 email VARCHAR(255) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 role VARCHAR(50) NOT NULL DEFAULT 'staff',
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 last_login_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_id BIGINT UNSIGNED NOT NULL,
 token_hash VARCHAR(255) NOT NULL UNIQUE,
 expires_at DATETIME NOT NULL,
 revoked_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE roles (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(80) NOT NULL UNIQUE,
 description VARCHAR(255),
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE staff_roles (
 staff_id BIGINT UNSIGNED NOT NULL,
 role_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY (staff_id, role_id),
 FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
 FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE staff_permissions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_id BIGINT UNSIGNED NOT NULL,
 feature VARCHAR(100) NOT NULL,
 capability VARCHAR(50) NOT NULL,
 UNIQUE KEY uq_staff_permission(staff_id,feature,capability),
 FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tiers (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL UNIQUE,
 description TEXT,
 sla_hours INT UNSIGNED,
 is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE territories (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL UNIQUE,
 code VARCHAR(40) UNIQUE,
 is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE visit_types (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL UNIQUE,
 description TEXT,
 is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE document_types (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL UNIQUE,
 required_for_onboarding BOOLEAN NOT NULL DEFAULT FALSE,
 is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE dealers (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 dealer_code VARCHAR(50) NOT NULL UNIQUE,
 name VARCHAR(200) NOT NULL,
 legal_name VARCHAR(255),
 email VARCHAR(255), phone VARCHAR(40), alternate_phone VARCHAR(40),
 address_line1 VARCHAR(255), address_line2 VARCHAR(255), city VARCHAR(100), state VARCHAR(100), country VARCHAR(100) DEFAULT 'India', postal_code VARCHAR(20),
 latitude DECIMAL(10,7), longitude DECIMAL(10,7),
 territory_id BIGINT UNSIGNED NULL, tier_id BIGINT UNSIGNED NULL, owner_staff_id BIGINT UNSIGNED NULL,
 status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE', notes TEXT,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE SET NULL,
 FOREIGN KEY (tier_id) REFERENCES tiers(id) ON DELETE SET NULL,
 FOREIGN KEY (owner_staff_id) REFERENCES staff(id) ON DELETE SET NULL,
 INDEX idx_dealer_owner(owner_staff_id), INDEX idx_dealer_territory(territory_id), INDEX idx_dealer_status(status)
) ENGINE=InnoDB;

CREATE TABLE dealer_contacts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 dealer_id BIGINT UNSIGNED NOT NULL,
 first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100), designation VARCHAR(120),
 email VARCHAR(255), phone VARCHAR(40), whatsapp VARCHAR(40),
 is_primary BOOLEAN NOT NULL DEFAULT FALSE, is_active BOOLEAN NOT NULL DEFAULT TRUE, notes TEXT,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE,
 INDEX idx_contact_dealer(dealer_id)
) ENGINE=InnoDB;

CREATE TABLE prospects (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 prospect_code VARCHAR(50) NOT NULL UNIQUE,
 name VARCHAR(200) NOT NULL, company_name VARCHAR(255), email VARCHAR(255), phone VARCHAR(40), city VARCHAR(100), state VARCHAR(100), source VARCHAR(100),
 owner_staff_id BIGINT UNSIGNED NULL, territory_id BIGINT UNSIGNED NULL,
 stage ENUM('NEW','CONTACTED','QUALIFIED','VISIT_PLANNED','VISIT_COMPLETED','ONBOARDING','APPROVED','CONVERTED','DROPPED') NOT NULL DEFAULT 'NEW',
 estimated_value DECIMAL(15,2), dropped_reason TEXT,
 converted_dealer_id BIGINT UNSIGNED NULL, client_uuid VARCHAR(100) UNIQUE,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (owner_staff_id) REFERENCES staff(id) ON DELETE SET NULL,
 FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE SET NULL,
 FOREIGN KEY (converted_dealer_id) REFERENCES dealers(id) ON DELETE SET NULL,
 INDEX idx_prospect_stage(stage), INDEX idx_prospect_owner(owner_staff_id)
) ENGINE=InnoDB;

CREATE TABLE prospect_stage_history (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 prospect_id BIGINT UNSIGNED NOT NULL, from_stage VARCHAR(40), to_stage VARCHAR(40) NOT NULL, changed_by BIGINT UNSIGNED NULL, reason TEXT,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
 FOREIGN KEY (changed_by) REFERENCES staff(id) ON DELETE SET NULL,
 INDEX idx_prospect_history(prospect_id,created_at)
) ENGINE=InnoDB;

CREATE TABLE prospect_onboarding_items (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 prospect_id BIGINT UNSIGNED NOT NULL, document_type_id BIGINT UNSIGNED NULL, title VARCHAR(200) NOT NULL,
 is_required BOOLEAN NOT NULL DEFAULT FALSE, is_completed BOOLEAN NOT NULL DEFAULT FALSE, completed_at DATETIME NULL, completed_by BIGINT UNSIGNED NULL,
 FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
 FOREIGN KEY (document_type_id) REFERENCES document_types(id) ON DELETE SET NULL,
 FOREIGN KEY (completed_by) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE request_types (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(50) NOT NULL UNIQUE, name VARCHAR(150) NOT NULL, description TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE request_fields (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 request_type_id BIGINT UNSIGNED NOT NULL, field_key VARCHAR(100) NOT NULL, label VARCHAR(150) NOT NULL, field_type VARCHAR(40) NOT NULL,
 is_required BOOLEAN NOT NULL DEFAULT FALSE, sort_order INT NOT NULL DEFAULT 0, options_json JSON NULL,
 UNIQUE KEY uq_request_field(request_type_id,field_key), FOREIGN KEY (request_type_id) REFERENCES request_types(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE request_statuses (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(50) NOT NULL UNIQUE, name VARCHAR(100) NOT NULL, is_closed BOOLEAN NOT NULL DEFAULT FALSE, sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE request_status_transitions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 from_status_id BIGINT UNSIGNED NOT NULL, to_status_id BIGINT UNSIGNED NOT NULL,
 UNIQUE KEY uq_status_transition(from_status_id,to_status_id),
 FOREIGN KEY (from_status_id) REFERENCES request_statuses(id) ON DELETE CASCADE,
 FOREIGN KEY (to_status_id) REFERENCES request_statuses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE service_providers (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 provider_code VARCHAR(60) NOT NULL UNIQUE, name VARCHAR(200) NOT NULL, slug VARCHAR(220) NOT NULL UNIQUE,
 logo_url VARCHAR(500), cover_image_url VARCHAR(500), description TEXT, contact_name VARCHAR(150), phone VARCHAR(40), email VARCHAR(255), address TEXT,
 categories_json JSON, verification_status VARCHAR(40) DEFAULT 'PENDING', status VARCHAR(30) DEFAULT 'ACTIVE', rating DECIMAL(3,2), review_count INT UNSIGNED DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE services (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 service_code VARCHAR(60) NOT NULL UNIQUE, name VARCHAR(200) NOT NULL, slug VARCHAR(220) NOT NULL UNIQUE, description TEXT,
 provider_id BIGINT UNSIGNED NULL, category VARCHAR(100), price DECIMAL(15,2), duration_minutes INT UNSIGNED, location_type VARCHAR(40), eligibility TEXT,
 features_json JSON, terms TEXT, status VARCHAR(30) DEFAULT 'ACTIVE', featured BOOLEAN DEFAULT FALSE,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE requests (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 request_no VARCHAR(60) NOT NULL UNIQUE, client_uuid VARCHAR(100) UNIQUE,
 dealer_id BIGINT UNSIGNED NULL, prospect_id BIGINT UNSIGNED NULL, request_type_id BIGINT UNSIGNED NOT NULL, status_id BIGINT UNSIGNED NOT NULL,
 priority VARCHAR(30) DEFAULT 'NORMAL', subject VARCHAR(255) NOT NULL, description TEXT,
 owner_staff_id BIGINT UNSIGNED NULL, assigned_staff_id BIGINT UNSIGNED NULL, territory_id BIGINT UNSIGNED NULL,
 sla_due_at DATETIME NULL, due_at DATETIME NULL, closed_at DATETIME NULL,
 external_reference VARCHAR(150), erp_status VARCHAR(60), erp_pushed_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL, FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE SET NULL,
 FOREIGN KEY (request_type_id) REFERENCES request_types(id), FOREIGN KEY (status_id) REFERENCES request_statuses(id),
 FOREIGN KEY (owner_staff_id) REFERENCES staff(id) ON DELETE SET NULL, FOREIGN KEY (assigned_staff_id) REFERENCES staff(id) ON DELETE SET NULL, FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE SET NULL,
 INDEX idx_request_dealer(dealer_id), INDEX idx_request_status(status_id), INDEX idx_request_assignee(assigned_staff_id), INDEX idx_request_sla(sla_due_at)
) ENGINE=InnoDB;

CREATE TABLE request_field_values (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, request_id BIGINT UNSIGNED NOT NULL, field_id BIGINT UNSIGNED NOT NULL, value_text TEXT, value_json JSON,
 UNIQUE KEY uq_request_field_value(request_id,field_id), FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE, FOREIGN KEY (field_id) REFERENCES request_fields(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE request_lines (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, request_id BIGINT UNSIGNED NOT NULL, service_id BIGINT UNSIGNED NULL, description VARCHAR(255) NOT NULL,
 quantity DECIMAL(12,2) DEFAULT 1, unit_price DECIMAL(15,2), amount DECIMAL(15,2),
 FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE, FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE request_notes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, request_id BIGINT UNSIGNED NOT NULL, staff_id BIGINT UNSIGNED NULL, note TEXT NOT NULL, client_uuid VARCHAR(100) UNIQUE,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE, FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
 INDEX idx_request_notes(request_id,created_at)
) ENGINE=InnoDB;

CREATE TABLE visits (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, visit_no VARCHAR(60) NOT NULL UNIQUE, client_uuid VARCHAR(100) UNIQUE,
 dealer_id BIGINT UNSIGNED NULL, prospect_id BIGINT UNSIGNED NULL, visit_type_id BIGINT UNSIGNED NOT NULL, assigned_staff_id BIGINT UNSIGNED NULL,
 scheduled_start DATETIME NOT NULL, scheduled_end DATETIME NULL, started_at DATETIME NULL, arrived_at DATETIME NULL, completed_at DATETIME NULL,
 status VARCHAR(40) DEFAULT 'PLANNED', latitude DECIMAL(10,7), longitude DECIMAL(10,7), notes TEXT, next_follow_up_at DATETIME NULL,
 FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL, FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE SET NULL,
 FOREIGN KEY (visit_type_id) REFERENCES visit_types(id), FOREIGN KEY (assigned_staff_id) REFERENCES staff(id) ON DELETE SET NULL,
 INDEX idx_visit_date(scheduled_start), INDEX idx_visit_assignee(assigned_staff_id)
) ENGINE=InnoDB;

CREATE TABLE visit_outcomes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, visit_id BIGINT UNSIGNED NOT NULL, outcome_code VARCHAR(50) NOT NULL, outcome_notes TEXT, next_action VARCHAR(255), next_follow_up_at DATETIME NULL, created_by BIGINT UNSIGNED NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE, FOREIGN KEY (created_by) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE timeline_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, entity_type VARCHAR(50) NOT NULL, entity_id BIGINT UNSIGNED NOT NULL, event_type VARCHAR(80) NOT NULL, title VARCHAR(255) NOT NULL, description TEXT,
 actor_staff_id BIGINT UNSIGNED NULL, metadata_json JSON, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (actor_staff_id) REFERENCES staff(id) ON DELETE SET NULL, INDEX idx_timeline_entity(entity_type,entity_id,created_at)
) ENGINE=InnoDB;

CREATE TABLE notifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, staff_id BIGINT UNSIGNED NOT NULL, type VARCHAR(60) NOT NULL, title VARCHAR(255) NOT NULL, message TEXT,
 entity_type VARCHAR(50), entity_id BIGINT UNSIGNED NULL, is_read BOOLEAN DEFAULT FALSE, read_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE, INDEX idx_notification_staff(staff_id,is_read,created_at)
) ENGINE=InnoDB;

CREATE TABLE sync_changes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, mutation_uuid VARCHAR(100) NOT NULL UNIQUE, client_uuid VARCHAR(100), entity_type VARCHAR(50) NOT NULL, entity_id BIGINT UNSIGNED NULL,
 operation VARCHAR(30) NOT NULL, payload_json JSON, status VARCHAR(30) DEFAULT 'APPLIED', error_message TEXT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, actor_staff_id BIGINT UNSIGNED NULL, action VARCHAR(100) NOT NULL, entity_type VARCHAR(50) NOT NULL, entity_id BIGINT UNSIGNED NULL,
 before_json JSON, after_json JSON, ip_address VARCHAR(45), user_agent TEXT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (actor_staff_id) REFERENCES staff(id) ON DELETE SET NULL, INDEX idx_audit_entity(entity_type,entity_id,created_at), INDEX idx_audit_actor(actor_staff_id,created_at)
) ENGINE=InnoDB;

-- Default Dealer Desk configuration
INSERT INTO roles(name,description) VALUES
('admin','Full Dealer Desk administration'),('manager','Dealer operations manager'),('staff','Dealer operations staff')
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT INTO tiers(name,description,sla_hours) VALUES
('Standard','Standard support tier',48),('Priority','Priority support tier',24),('Critical','Critical support tier',8)
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT INTO visit_types(name,description) VALUES
('Dealer Visit','General dealer visit'),('Follow-up','Prospect or dealer follow-up'),('Inspection','Site or operational inspection'),('Training','Dealer training visit')
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT INTO document_types(name,required_for_onboarding) VALUES
('GST Certificate',1),('PAN Card',1),('Address Proof',1),('Bank Details',0),('Agreement',1)
ON DUPLICATE KEY UPDATE required_for_onboarding=VALUES(required_for_onboarding);

INSERT INTO request_types(code,name,description) VALUES
('GENERAL','General Request','General dealer operational request'),('SERVICE','Service Request','Service-related request'),('SUPPORT','Support Request','Dealer support request'),('DOCUMENT','Document Request','Dealer document request')
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT INTO request_statuses(code,name,is_closed,sort_order) VALUES
('NEW','New',0,1),('ASSIGNED','Assigned',0,2),('IN_PROGRESS','In Progress',0,3),('WAITING','Waiting',0,4),('RESOLVED','Resolved',0,5),('CLOSED','Closed',1,6),('REOPENED','Reopened',0,7)
ON DUPLICATE KEY UPDATE name=VALUES(name),is_closed=VALUES(is_closed),sort_order=VALUES(sort_order);

INSERT IGNORE INTO request_status_transitions(from_status_id,to_status_id)
SELECT a.id,b.id FROM request_statuses a JOIN request_statuses b
WHERE (a.code,b.code) IN (('NEW','ASSIGNED'),('NEW','IN_PROGRESS'),('ASSIGNED','IN_PROGRESS'),('IN_PROGRESS','WAITING'),('IN_PROGRESS','RESOLVED'),('WAITING','IN_PROGRESS'),('RESOLVED','CLOSED'),('RESOLVED','REOPENED'),('CLOSED','REOPENED'));

COMMIT;
