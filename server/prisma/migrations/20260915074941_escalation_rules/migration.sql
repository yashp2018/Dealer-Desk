-- CreateTable
CREATE TABLE `escalation_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `trigger_priority` INTEGER NULL,
    `trigger_request_type_id` INTEGER NULL,
    `trigger_hours_overdue` INTEGER NOT NULL,
    `action_type` VARCHAR(191) NOT NULL,
    `action_target_staff_id` INTEGER NULL,
    `action_target_role` VARCHAR(191) NULL,
    `escalation_message` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `escalation_rules_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `escalation_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rule_id` INTEGER NOT NULL,
    `request_id` INTEGER NOT NULL,
    `action_taken` TEXT NOT NULL,
    `fired_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `escalation_logs_request_id_idx`(`request_id`),
    UNIQUE INDEX `escalation_logs_rule_id_request_id_key`(`rule_id`, `request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `escalation_rules` ADD CONSTRAINT `escalation_rules_trigger_request_type_id_fkey` FOREIGN KEY (`trigger_request_type_id`) REFERENCES `request_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `escalation_rules` ADD CONSTRAINT `escalation_rules_action_target_staff_id_fkey` FOREIGN KEY (`action_target_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `escalation_logs` ADD CONSTRAINT `escalation_logs_rule_id_fkey` FOREIGN KEY (`rule_id`) REFERENCES `escalation_rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `escalation_logs` ADD CONSTRAINT `escalation_logs_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
