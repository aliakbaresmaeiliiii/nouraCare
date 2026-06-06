-- Add MENOPAUSE to reproductive_state enum
ALTER TABLE `reproductive_state`
  MODIFY `state` ENUM('CYCLE', 'PLANNING', 'PREGNANT', 'POSTPARTUM', 'MENOPAUSE') NOT NULL;

-- Menopause domain details (stage + optional notes)
CREATE TABLE `menopause_data` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `stage` ENUM('PERIMENOPAUSE', 'MENOPAUSE') NOT NULL DEFAULT 'PERIMENOPAUSE',
  `notes` VARCHAR(2000) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `menopause_data_userId_key`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
