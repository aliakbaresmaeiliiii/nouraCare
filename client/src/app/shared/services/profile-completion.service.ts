import { Injectable, signal, computed, inject } from '@angular/core';
import { ImageUrlService } from './image-url.service';

@Injectable({
    providedIn: 'root'
})
export class ProfileCompletionService {
    private imageUrlService = inject(ImageUrlService);

    // Signal to store user data
    private userData = signal<any>({});

    // Computed signal for profile completion percentage
    public profileCompletion = computed(() => {
        const user = this.userData();
        const completion = this.computeProfileCompletion(user);
        return completion;
    });

    // Method to update user data
    updateUserData(user: any) {
        this.userData.set(user);
    }

    // Method to refresh from localStorage
    refreshFromStorage() {
        try {
            const userInfoStore = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const user = userInfoStore?.user || {};
            this.updateUserData(user);
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.updateUserData({});
        }
    }

    private computeProfileCompletion(user: any): number {
        // Calculate progress based on all profile fields from edit profile form
        const profileFields = [
            { value: user.name, weight: 20 },           // Name - 20%
            { value: user.email, weight: 20 },          // Email - 20%
            { value: user.birthday, weight: 15 },        // Birthday - 15%
            { value: user.profileImage, weight: 15 },    // Profile Image - 15%
            // Additional fields from edit profile that we can check
            { value: user.status, weight: 10 },         // Status - 10%
            { value: user.menstrualCycleLength, weight: 5 }, // Cycle Length - 5%
            { value: user.periodDuration, weight: 5 },   // Period Duration - 5%
            { value: user.lastPeriodStartDate, weight: 10 }  // Last Period Start - 10%
        ];
        let totalProgress = 0;
        let totalWeight = 0;

        profileFields.forEach(field => {
            totalWeight += field.weight;
            if (field.value && field.value !== '' && field.value !== null && field.value !== undefined) {
                totalProgress += field.weight;
            }
        });

        return Math.round((totalProgress / totalWeight) * 100);
    }
}
