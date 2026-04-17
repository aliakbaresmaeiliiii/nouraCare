-- Growth: referral tables + engagement check-in / reward points

ALTER TABLE `user_engagement`
ADD COLUMN `growthPoints` INTEGER NOT NULL DEFAULT 0,
ADD COLUMN `checkInStreak` INTEGER NOT NULL DEFAULT 0,
ADD COLUMN `lastCheckInDayIso` VARCHAR(10) NULL;

CREATE TABLE `referral_code` (
    `userId` INTEGER NOT NULL,
    `code` VARCHAR(12) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `referral_code_code_key`(`code`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `referral` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `referrerUserId` INTEGER NOT NULL,
    `referredUserId` INTEGER NOT NULL,
    `code` VARCHAR(12) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `referral_referredUserId_key`(`referredUserId`),
    INDEX `referral_referrer_user_idx`(`referrerUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `referral_code` ADD CONSTRAINT `referral_code_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `referral` ADD CONSTRAINT `referral_referrerUserId_fkey` FOREIGN KEY (`referrerUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `referral` ADD CONSTRAINT `referral_referredUserId_fkey` FOREIGN KEY (`referredUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
