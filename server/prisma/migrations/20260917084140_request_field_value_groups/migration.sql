-- AlterTable
ALTER TABLE `request_field_values` ADD COLUMN `group_index` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex (added before dropping the old one so the FK on request_id always has a covering index)
CREATE UNIQUE INDEX `request_field_values_request_id_key_group_index_key` ON `request_field_values`(`request_id`, `key`, `group_index`);

-- DropIndex
ALTER TABLE `request_field_values` DROP INDEX `request_field_values_request_id_key_key`;
