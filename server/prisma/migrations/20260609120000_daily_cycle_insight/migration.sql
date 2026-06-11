-- CreateTable
CREATE TABLE `daily_cycle_insight` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `insightDate` DATE NOT NULL,
    `insight` TEXT NOT NULL,
    `source` ENUM('RULE', 'AI') NOT NULL DEFAULT 'RULE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `daily_cycle_insight_userId_idx`(`userId`),
    UNIQUE INDEX `daily_cycle_insight_userId_insightDate_key`(`userId`, `insightDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
