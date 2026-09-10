-- CreateTable
CREATE TABLE `staff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `failed_login_count` INTEGER NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `roles_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `permissions_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_roles` (
    `staff_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,

    PRIMARY KEY (`staff_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `staff_id` INTEGER NULL,
    `dealer_user_id` INTEGER NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `app_version` VARCHAR(191) NOT NULL,
    `os_version` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `replaced_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_staff_id_idx`(`staff_id`),
    INDEX `refresh_tokens_dealer_user_id_idx`(`dealer_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tiers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `multiplier` DOUBLE NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#6b7280',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `territories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doc_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `request_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `default_priority` INTEGER NOT NULL,
    `sla_hours` INTEGER NOT NULL,
    `push_target` VARCHAR(191) NULL,
    `allows_prospect` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `request_types_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `request_type_fields` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `request_type_id` INTEGER NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `input_type` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NULL,
    `options` JSON NOT NULL,
    `filter` VARCHAR(191) NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `help_text` VARCHAR(191) NOT NULL DEFAULT '',

    UNIQUE INDEX `request_type_fields_request_type_id_key_key`(`request_type_id`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `status_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity_type` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `status_config_entity_type_key_key`(`entity_type`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `status_transitions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity_type` VARCHAR(191) NOT NULL,
    `from_status` VARCHAR(191) NOT NULL,
    `to_status` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `status_transitions_entity_type_from_status_to_status_key`(`entity_type`, `from_status`, `to_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_config` (
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sequences` (
    `name` VARCHAR(191) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dealers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `tier_id` INTEGER NOT NULL,
    `territory_id` INTEGER NOT NULL,
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `state_normalized` VARCHAR(191) NOT NULL DEFAULT '',
    `health` VARCHAR(191) NOT NULL DEFAULT 'good',
    `health_score` INTEGER NULL,
    `phone_primary` VARCHAR(191) NOT NULL DEFAULT '',
    `whatsapp_phone` VARCHAR(191) NOT NULL DEFAULT '',
    `owner_staff_id` INTEGER NULL,
    `client_id` INTEGER NULL,
    `territory_is_manual` BOOLEAN NOT NULL DEFAULT false,
    `last_contact_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dealers_code_key`(`code`),
    INDEX `dealers_territory_id_idx`(`territory_id`),
    INDEX `dealers_tier_id_idx`(`tier_id`),
    INDEX `dealers_owner_staff_id_idx`(`owner_staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dealer_contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dealer_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role_label` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dealer_contacts_dealer_id_idx`(`dealer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prospects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ref_no` VARCHAR(191) NOT NULL,
    `company_name` VARCHAR(191) NOT NULL,
    `contact_name` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `whatsapp` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `state_normalized` VARCHAR(191) NOT NULL DEFAULT '',
    `stage` VARCHAR(191) NOT NULL DEFAULT 'new',
    `stage_changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `owner_staff_id` INTEGER NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT '',
    `converted_dealer_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `prospects_ref_no_key`(`ref_no`),
    UNIQUE INDEX `prospects_converted_dealer_id_key`(`converted_dealer_id`),
    INDEX `prospects_owner_staff_id_idx`(`owner_staff_id`),
    INDEX `prospects_stage_idx`(`stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `onboarding_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prospect_id` INTEGER NOT NULL,
    `doc_name` VARCHAR(191) NOT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',

    INDEX `onboarding_items_prospect_id_idx`(`prospect_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ref_no` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type_id` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `priority` INTEGER NOT NULL DEFAULT 3,
    `priority_override` INTEGER NULL,
    `priority_reason` VARCHAR(191) NULL,
    `dealer_id` INTEGER NULL,
    `prospect_id` INTEGER NULL,
    `owner_staff_id` INTEGER NULL,
    `due_at` DATETIME(3) NULL,
    `scheduled_at` DATETIME(3) NULL,
    `completion_required` INTEGER NOT NULL DEFAULT 0,
    `completion_done` INTEGER NOT NULL DEFAULT 0,
    `closed_reason` VARCHAR(191) NULL,
    `done_at` DATETIME(3) NULL,
    `erp_external_ref` VARCHAR(191) NULL,
    `erp_sync_status` VARCHAR(191) NULL,
    `client_uuid` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `requests_ref_no_key`(`ref_no`),
    UNIQUE INDEX `requests_client_uuid_key`(`client_uuid`),
    INDEX `requests_dealer_id_idx`(`dealer_id`),
    INDEX `requests_prospect_id_idx`(`prospect_id`),
    INDEX `requests_owner_staff_id_idx`(`owner_staff_id`),
    INDEX `requests_status_idx`(`status`),
    INDEX `requests_priority_idx`(`priority`),
    INDEX `requests_due_at_idx`(`due_at`),
    INDEX `requests_scheduled_at_idx`(`scheduled_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `request_field_values` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `request_id` INTEGER NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,

    UNIQUE INDEX `request_field_values_request_id_key_key`(`request_id`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `request_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `request_id` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `qty` DOUBLE NOT NULL DEFAULT 1,
    `unit_rate` DOUBLE NULL,
    `total` DOUBLE NULL,

    INDEX `request_lines_request_id_idx`(`request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ref_no` VARCHAR(191) NOT NULL,
    `dealer_id` INTEGER NULL,
    `prospect_id` INTEGER NULL,
    `visit_type_id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `scheduled_at` DATETIME(3) NOT NULL,
    `start_at` DATETIME(3) NULL,
    `end_at` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `outcome` VARCHAR(191) NULL,
    `outcome_note` TEXT NULL,
    `next_step` VARCHAR(191) NULL,
    `next_at` DATETIME(3) NULL,
    `owner_staff_id` INTEGER NOT NULL,
    `agenda_json` JSON NULL,
    `client_uuid` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visits_ref_no_key`(`ref_no`),
    UNIQUE INDEX `visits_client_uuid_key`(`client_uuid`),
    INDEX `visits_dealer_id_idx`(`dealer_id`),
    INDEX `visits_prospect_id_idx`(`prospect_id`),
    INDEX `visits_owner_staff_id_idx`(`owner_staff_id`),
    INDEX `visits_scheduled_at_idx`(`scheduled_at`),
    INDEX `visits_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timeline_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` INTEGER NOT NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL,
    `actor_staff_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `timeline_entries_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `staff_id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `message` TEXT NOT NULL,
    `link_url` VARCHAR(191) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_staff_id_is_read_idx`(`staff_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_staff_id` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` INTEGER NULL,
    `before_json` JSON NULL,
    `after_json` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `request_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `audit_logs_actor_staff_id_idx`(`actor_staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dealer_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `dealer_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `failed_login_count` INTEGER NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dealer_users_email_key`(`email`),
    INDEX `dealer_users_dealer_id_idx`(`dealer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `providers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider_code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `cover_image` VARCHAR(191) NULL,
    `short_description` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `contact_phone` VARCHAR(191) NULL,
    `contact_email` VARCHAR(191) NULL,
    `contact_website` VARCHAR(191) NULL,
    `address_country` VARCHAR(191) NULL,
    `address_state` VARCHAR(191) NULL,
    `address_city` VARCHAR(191) NULL,
    `address_line` VARCHAR(191) NULL,
    `address_postal_code` VARCHAR(191) NULL,
    `categories` JSON NOT NULL,
    `verification_status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `service_count` INTEGER NOT NULL DEFAULT 0,
    `rating` DOUBLE NULL,
    `review_count` INTEGER NOT NULL DEFAULT 0,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `providers_provider_code_key`(`provider_code`),
    UNIQUE INDEX `providers_slug_key`(`slug`),
    INDEX `providers_status_idx`(`status`),
    INDEX `providers_verification_status_idx`(`verification_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NULL,
    `category_name` VARCHAR(191) NULL,
    `short_description` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `images` JSON NOT NULL,
    `provider_id` INTEGER NULL,
    `service_type` VARCHAR(191) NULL,
    `pricing_type` VARCHAR(191) NULL,
    `pricing_amount` DOUBLE NULL,
    `pricing_min_amount` DOUBLE NULL,
    `pricing_max_amount` DOUBLE NULL,
    `pricing_currency` VARCHAR(191) NULL,
    `duration_value` DOUBLE NULL,
    `duration_unit` VARCHAR(191) NULL,
    `location_country` VARCHAR(191) NULL,
    `location_state` VARCHAR(191) NULL,
    `location_city` VARCHAR(191) NULL,
    `location_address` VARCHAR(191) NULL,
    `availability_enabled` BOOLEAN NOT NULL DEFAULT true,
    `availability_days` JSON NOT NULL,
    `availability_start` VARCHAR(191) NULL,
    `availability_end` VARCHAR(191) NULL,
    `eligibility` JSON NOT NULL,
    `required_documents` JSON NOT NULL,
    `features` JSON NOT NULL,
    `terms_and_conditions` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `services_service_code_key`(`service_code`),
    UNIQUE INDEX `services_slug_key`(`slug`),
    INDEX `services_status_idx`(`status`),
    INDEX `services_provider_id_idx`(`provider_id`),
    INDEX `services_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_mutations` (
    `client_uuid` VARCHAR(191) NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `op_type` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'applied',
    `error` TEXT NULL,
    `applied_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`client_uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_roles` ADD CONSTRAINT `staff_roles_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_roles` ADD CONSTRAINT `staff_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_dealer_user_id_fkey` FOREIGN KEY (`dealer_user_id`) REFERENCES `dealer_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_type_fields` ADD CONSTRAINT `request_type_fields_request_type_id_fkey` FOREIGN KEY (`request_type_id`) REFERENCES `request_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealers` ADD CONSTRAINT `dealers_tier_id_fkey` FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealers` ADD CONSTRAINT `dealers_territory_id_fkey` FOREIGN KEY (`territory_id`) REFERENCES `territories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealers` ADD CONSTRAINT `dealers_owner_staff_id_fkey` FOREIGN KEY (`owner_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealer_contacts` ADD CONSTRAINT `dealer_contacts_dealer_id_fkey` FOREIGN KEY (`dealer_id`) REFERENCES `dealers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_owner_staff_id_fkey` FOREIGN KEY (`owner_staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_converted_dealer_id_fkey` FOREIGN KEY (`converted_dealer_id`) REFERENCES `dealers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `onboarding_items` ADD CONSTRAINT `onboarding_items_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requests` ADD CONSTRAINT `requests_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `request_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requests` ADD CONSTRAINT `requests_dealer_id_fkey` FOREIGN KEY (`dealer_id`) REFERENCES `dealers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requests` ADD CONSTRAINT `requests_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requests` ADD CONSTRAINT `requests_owner_staff_id_fkey` FOREIGN KEY (`owner_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_field_values` ADD CONSTRAINT `request_field_values_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_lines` ADD CONSTRAINT `request_lines_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_dealer_id_fkey` FOREIGN KEY (`dealer_id`) REFERENCES `dealers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_visit_type_id_fkey` FOREIGN KEY (`visit_type_id`) REFERENCES `visit_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_owner_staff_id_fkey` FOREIGN KEY (`owner_staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_entries` ADD CONSTRAINT `timeline_entries_actor_staff_id_fkey` FOREIGN KEY (`actor_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_staff_id_fkey` FOREIGN KEY (`actor_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealer_users` ADD CONSTRAINT `dealer_users_dealer_id_fkey` FOREIGN KEY (`dealer_id`) REFERENCES `dealers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `providers` ADD CONSTRAINT `providers_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
