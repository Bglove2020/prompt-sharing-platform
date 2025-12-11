-- AlterTable
ALTER TABLE `post` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'background',
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'active';
