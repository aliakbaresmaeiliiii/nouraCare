-- CreateTable
CREATE TABLE `onboarding_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `pregnancyStatus` VARCHAR(191) NULL,
    `lastPeriodDate` DATETIME(3) NULL,
    `cycleLength` INTEGER NULL,
    `periodDuration` INTEGER NULL,
    `pregnancyWeek` INTEGER NULL,
    `pregnancyProgress` VARCHAR(191) NULL,
    `healthGoals` TEXT NULL,
    `notificationsEnabled` BOOLEAN NULL DEFAULT true,
    `selectedOptions` JSON NULL,
    `onboardingStep` INTEGER NULL DEFAULT 1,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `onboarding_data_userId_key`(`userId`),
    INDEX `onboarding_data_userId_idx`(`userId`),
    INDEX `onboarding_data_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `onboarding_data` ADD CONSTRAINT `onboarding_data_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
