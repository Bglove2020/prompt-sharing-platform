/*
  Warnings:

  - A unique constraint covering the columns `[title,authorId,deletedAt]` on the table `Prompt` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Prompt_title_deletedAt_key` ON `prompt`;

-- CreateIndex
CREATE UNIQUE INDEX `Prompt_title_authorId_deletedAt_key` ON `Prompt`(`title`, `authorId`, `deletedAt`);
