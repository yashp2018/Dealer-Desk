-- CreateTable
CREATE TABLE `dealer_import_candidates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `phone_primary` VARCHAR(191) NULL,
    `state_normalized` VARCHAR(191) NULL,
    `source_file_name` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `used_dealer_id` INTEGER NULL,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `used_at` DATETIME(3) NULL,

    INDEX `dealer_import_candidates_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dealer_import_candidates` ADD CONSTRAINT `dealer_import_candidates_used_dealer_id_fkey` FOREIGN KEY (`used_dealer_id`) REFERENCES `dealers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealer_import_candidates` ADD CONSTRAINT `dealer_import_candidates_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
