-- Safe, additive change: does not delete or truncate any tables.
-- Use this if `npx prisma db push` fails (common when Prisma schema and MySQL drift).
--
-- Run in MySQL Workbench / CLI against database `CycleTracking`:
--   mysql -u ... -p CycleTracking < prisma/sql/add_user_profile_profile_image.sql
--
-- If you see "Duplicate column name 'profileImage'", the column already exists — skip.

ALTER TABLE `user_profile`
  ADD COLUMN `profileImage` VARCHAR(191) NULL;
