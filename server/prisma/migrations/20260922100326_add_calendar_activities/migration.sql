-- CreateTable
CREATE TABLE `calendar_activities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(191) NOT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Kolkata',
    `reminder_minutes` INTEGER NULL,
    `dealer_id` INTEGER NULL,
    `owner_staff_id` INTEGER NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 3,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `completed_at` DATETIME(3) NULL,
    `created_by` INTEGER NOT NULL,
    `updated_by` INTEGER NULL,
    `client_uuid` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `calendar_activities_client_uuid_key`(`client_uuid`),
    INDEX `calendar_activities_owner_staff_id_idx`(`owner_staff_id`),
    INDEX `calendar_activities_dealer_id_idx`(`dealer_id`),
    INDEX `calendar_activities_start_at_idx`(`start_at`),
    INDEX `calendar_activities_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `calendar_activities` ADD CONSTRAINT `calendar_activities_dealer_id_fkey` FOREIGN KEY (`dealer_id`) REFERENCES `dealers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_activities` ADD CONSTRAINT `calendar_activities_owner_staff_id_fkey` FOREIGN KEY (`owner_staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_activities` ADD CONSTRAINT `calendar_activities_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_activities` ADD CONSTRAINT `calendar_activities_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

