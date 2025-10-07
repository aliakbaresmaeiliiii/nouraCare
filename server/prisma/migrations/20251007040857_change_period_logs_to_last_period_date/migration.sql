/*
  Warnings:

  - You are about to drop the column `endDate` on the `period_logs` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `period_logs` table. All the data in the column will be lost.
  - Added the required column `lastPeriodDate` to the `period_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `period_logs` DROP COLUMN `endDate`,
    DROP COLUMN `startDate`,
    ADD COLUMN `lastPeriodDate` DATETIME(3) NOT NULL;
