-- Adaptive cycle personalization (MySQL)
ALTER TABLE `cycle_data`
  ADD COLUMN `adaptiveCycleLength` DOUBLE NULL,
  ADD COLUMN `predictionErrors` JSON NULL,
  ADD COLUMN `lastPredictedNextPeriodIso` VARCHAR(12) NULL;
