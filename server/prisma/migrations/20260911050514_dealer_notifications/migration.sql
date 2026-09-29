-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `dealer_id` INTEGER NULL,
    MODIFY `staff_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `notifications_dealer_id_is_read_idx` ON `notifications`(`dealer_id`, `is_read`);

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_dealer_id_fkey` FOREIGN KEY (`dealer_id`) REFERENCES `dealers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
