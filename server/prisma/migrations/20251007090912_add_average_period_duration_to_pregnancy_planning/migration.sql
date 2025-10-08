/*
  Warnings:

  - Added the required column `averagePeriodDuration` to the `pregnancy_planning` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pregnancy_planning` ADD COLUMN `averagePeriodDuration` INTEGER NOT NULL;
