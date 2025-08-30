-- AlterTable
ALTER TABLE `user` ADD COLUMN `lastPeriodStartDate` DATETIME(3) NULL,
    ADD COLUMN `menstrualCycleLength` INTEGER NULL,
    ADD COLUMN `periodDuration` INTEGER NULL,
    ADD COLUMN `status` ENUM('PLANNING_PREGNANCY', 'PREGNANT', 'HAS_CHILD') NULL;
