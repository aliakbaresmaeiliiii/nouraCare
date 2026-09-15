-- In-app support tickets (user ↔ admin)

CREATE TABLE `support_ticket` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `subject` VARCHAR(200) NOT NULL,
    `category` ENUM('BUG', 'QUESTION', 'ACCOUNT', 'PAYMENT', 'FEEDBACK', 'OTHER') NOT NULL DEFAULT 'QUESTION',
    `status` ENUM('OPEN', 'IN_PROGRESS', 'WAITING_ON_USER', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `priority` ENUM('LOW', 'NORMAL', 'HIGH') NOT NULL DEFAULT 'NORMAL',
    `appVersion` VARCHAR(40) NULL,
    `deviceInfo` VARCHAR(240) NULL,
    `pagePath` VARCHAR(240) NULL,
    `assignedAdminId` INTEGER NULL,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `support_ticket_userId_lastMessageAt_idx`(`userId`, `lastMessageAt`),
    INDEX `support_ticket_status_lastMessageAt_idx`(`status`, `lastMessageAt`),
    INDEX `support_ticket_assignedAdminId_idx`(`assignedAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `support_ticket_message` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `authorId` INTEGER NOT NULL,
    `authorRole` ENUM('USER', 'ADMIN') NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `support_ticket_message_ticketId_createdAt_idx`(`ticketId`, `createdAt`),
    INDEX `support_ticket_message_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `support_ticket` ADD CONSTRAINT `support_ticket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `support_ticket_message` ADD CONSTRAINT `support_ticket_message_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `support_ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
