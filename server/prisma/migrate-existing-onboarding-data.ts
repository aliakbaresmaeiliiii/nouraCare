import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExistingOnboardingData() {
  console.log('Starting migration of existing onboarding data from user table to onboarding_data table...');

  try {
    // Get all users who have onboarding-related data
    const usersWithOnboardingData = await prisma.user.findMany({
      where: {
        OR: [
          { status: { not: null } },
          { lastPeriodStartDate: { not: null } },
          { menstrualCycleLength: { not: null } },
          { periodDuration: { not: null } },
          { healthGoals: { not: null } },
          { pregnancyProgress: { not: null } },
          { pregnancyWeek: { not: null } },
        ],
      },
    });

    console.log(`Found ${usersWithOnboardingData.length} users with existing onboarding data to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of usersWithOnboardingData) {
      try {
        // Check if onboarding data already exists for this user
        const existingOnboardingData = await prisma.onboardingData.findUnique({
          where: { userId: user.id },
        });

        if (existingOnboardingData) {
          console.log(`Onboarding data already exists for user ${user.id}, skipping...`);
          continue;
        }

        // Map user fields to onboarding data fields
        const onboardingData: any = {
          userId: user.id,
          isCompleted: true,
          onboardingStep: 1,
        };

        // Map status field
        if (user.status) {
          onboardingData.pregnancyStatus = user.status;
        }

        // Map last period date
        if (user.lastPeriodStartDate) {
          onboardingData.lastPeriodDate = user.lastPeriodStartDate;
        }

        // Map cycle length
        if (user.menstrualCycleLength) {
          onboardingData.cycleLength = user.menstrualCycleLength;
        }

        // Map period duration
        if (user.periodDuration) {
          onboardingData.periodDuration = user.periodDuration;
        }

        // Map pregnancy week
        if (user.pregnancyWeek) {
          onboardingData.pregnancyWeek = user.pregnancyWeek;
        }

        // Map pregnancy progress
        if (user.pregnancyProgress) {
          onboardingData.pregnancyProgress = user.pregnancyProgress;
        }

        // Map health goals
        if (user.healthGoals) {
          onboardingData.healthGoals = user.healthGoals;
        }

        // Map notifications
        if (user.notificationsEnabled !== undefined) {
          onboardingData.notificationsEnabled = user.notificationsEnabled;
        }

        // Map isPregnant to pregnancyStatus if needed
        if (user.isPregnant && !user.status) {
          onboardingData.pregnancyStatus = 'PREGNANT';
        }

        // Create onboarding data record
        await prisma.onboardingData.create({
          data: onboardingData,
        });

        migratedCount++;
        console.log(`✅ Migrated onboarding data for user ${user.id} (${user.email})`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate onboarding data for user ${user.id}:`, error);
      }
    }

    console.log('\nMigration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`❌ Failed to migrate: ${errorCount} users`);
    console.log(`📊 Total users processed: ${usersWithOnboardingData.length}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateExistingOnboardingData()
  .then(() => {
    console.log('Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
