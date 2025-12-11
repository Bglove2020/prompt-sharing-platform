/*
  Warnings:

  - You are about to drop the column `prompt` on the `post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `post` DROP COLUMN `prompt`,
    ADD COLUMN `content` VARCHAR(191) NULL;
