/*
  Warnings:

  - You are about to drop the `posttag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `posttagrelation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `tags` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `posttagrelation` DROP FOREIGN KEY `PostTagRelation_postId_fkey`;

-- DropForeignKey
ALTER TABLE `posttagrelation` DROP FOREIGN KEY `PostTagRelation_tagId_fkey`;

-- AlterTable
ALTER TABLE `post` ADD COLUMN `tags` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `posttag`;

-- DropTable
DROP TABLE `posttagrelation`;
