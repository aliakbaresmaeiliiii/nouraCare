-- AlterTable
ALTER TABLE `user` ADD COLUMN `isPregnant` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `pregnancyEndDate` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `pregnancy_planning` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `lastPeriodDate` DATETIME(3) NOT NULL,
    `cycleLength` INTEGER NOT NULL,
    `lifestyleGoals` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pregnancy_planning_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pregnancy_planning` ADD CONSTRAINT `pregnancy_planning_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
