export interface SymptomOption {
    id: string;
    name: string;
    icon: string;
    category: string;
}

export interface SymptomData {
    id: string;
    name: string;
    category: string;
    icon: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes?: string;
    timestamp: Date;
  }
  
  export interface DailySymptoms {
    date: string;
    mood: 'excellent' | 'good' | 'okay' | 'poor' | 'terrible';
    energy: 'high' | 'medium' | 'low';
    symptoms: SymptomData[];
    notes: string;
  }

export interface SymptomOptionWithTrimester extends SymptomOption {
    trimester: number[];
}


export const SYMPTOMS_CONFIG = {
    sexDriveOptions: [
        { id: 'masturbation', name: 'Masturbation', icon: 'checkmark' },
        { id: 'no_sex', name: "Didn't have sex", icon: 'heart-dislike-outline' },
        { id: 'protected_sex', name: 'Protected sex', icon: 'lock-closed-outline' },
        { id: 'unprotected_sex', name: 'Unprotected sex', icon: 'lock-open-outline' },
        { id: 'high_sex_drive', name: 'High sex drive', icon: 'heart' },
        { id: 'low_sex_drive', name: 'Low sex drive', icon: 'heart-outline' }
    ] as SymptomOption[],

    // Available symptoms based on pregnancy stage
    availableSymptoms: [
        // First Trimester Symptoms
        { id: 'morning_sickness', name: 'Morning Sickness', category: 'Digestive', icon: 'restaurant-outline', trimester: [1, 2, 3] },
        { id: 'fatigue', name: 'Fatigue', category: 'General', icon: 'bed-outline', trimester: [1, 2, 3] },
        { id: 'breast_tenderness', name: 'Breast Tenderness', category: 'Physical', icon: 'heart-outline', trimester: [1, 2] },
        { id: 'frequent_urination', name: 'Frequent Urination', category: 'Physical', icon: 'water-outline', trimester: [1, 2, 3] },
        { id: 'food_aversions', name: 'Food Aversions', category: 'Digestive', icon: 'close-circle-outline', trimester: [1, 2] },
        { id: 'mood_swings', name: 'Mood Swings', category: 'Emotional', icon: 'happy-outline', trimester: [1, 2, 3] },

        // Second Trimester Symptoms
        { id: 'back_pain', name: 'Back Pain', category: 'Physical', icon: 'medical-outline', trimester: [2, 3] },
        { id: 'leg_cramps', name: 'Leg Cramps', category: 'Physical', icon: 'fitness-outline', trimester: [2, 3] },
        { id: 'heartburn', name: 'Heartburn', category: 'Digestive', icon: 'flame-outline', trimester: [2, 3] },
        { id: 'nasal_congestion', name: 'Nasal Congestion', category: 'Physical', icon: 'airplane-outline', trimester: [2, 3] },
        { id: 'baby_movements', name: 'Baby Movements', category: 'Physical', icon: 'hand-left-outline', trimester: [2, 3] },

        // Third Trimester Symptoms
        { id: 'shortness_breath', name: 'Shortness of Breath', category: 'Physical', icon: 'airplane-outline', trimester: [3] },
        { id: 'swelling', name: 'Swelling (Edema)', category: 'Physical', icon: 'water-outline', trimester: [3] },
        { id: 'braxton_hicks', name: 'Braxton Hicks', category: 'Physical', icon: 'pulse-outline', trimester: [3] },
        { id: 'sleep_difficulties', name: 'Sleep Difficulties', category: 'General', icon: 'moon-outline', trimester: [3] },
        { id: 'nesting_instinct', name: 'Nesting Instinct', category: 'Emotional', icon: 'home-outline', trimester: [3] },

        // General Symptoms
        { id: 'headache', name: 'Headache', category: 'Physical', icon: 'medical-outline', trimester: [1, 2, 3] },
        { id: 'dizziness', name: 'Dizziness', category: 'Physical', icon: 'refresh-outline', trimester: [1, 2, 3] },
        { id: 'constipation', name: 'Constipation', category: 'Digestive', icon: 'restaurant-outline', trimester: [1, 2, 3] },
        { id: 'anxiety', name: 'Anxiety', category: 'Emotional', icon: 'heart-outline', trimester: [1, 2, 3] },
        { id: 'cravings', name: 'Food Cravings', category: 'Digestive', icon: 'restaurant-outline', trimester: [1, 2, 3] }
    ] as SymptomOptionWithTrimester[],

    moodOptions: [
        { id: 'calm', name: 'Calm', icon: 'happy-outline' },
        { id: 'happy', name: 'Happy', icon: 'happy' },
        { id: 'energetic', name: 'Energetic', icon: 'flash-outline' },
        { id: 'frisky', name: 'Frisky', icon: 'heart-outline' },
        { id: 'mood_swings', name: 'Mood swings', icon: 'swap-horizontal-outline' },
        { id: 'irritated', name: 'Irritated', icon: 'sad-outline' },
        { id: 'sad', name: 'Sad', icon: 'sad' },
        { id: 'anxious', name: 'Anxious', icon: 'alert-circle-outline' },
        { id: 'depressed', name: 'Depressed', icon: 'sad-outline' },
        { id: 'guilty', name: 'Feeling guilty', icon: 'shield-outline' },
        { id: 'obsessive', name: 'Obsessive thoughts', icon: 'refresh-outline' },
        { id: 'low_energy', name: 'Low energy', icon: 'battery-dead-outline' },
        { id: 'apathetic', name: 'Apathetic', icon: 'remove-circle-outline' },
        { id: 'confused', name: 'Confused', icon: 'help-circle-outline' },
        { id: 'self_critical', name: 'Very self-critical', icon: 'warning-outline' }
    ] as SymptomOption[],

    physicalSymptoms: [
        { id: 'breast_tenderness', name: 'Breast Tenderness', icon: 'heart-outline' },
        { id: 'headache', name: 'Headache', icon: 'medical-outline' },
        { id: 'leg_cramps', name: 'Leg Cramps', icon: 'fitness-outline' },
        { id: 'back_pain', name: 'Back Pain', icon: 'medical-outline' },
        { id: 'morning_sickness', name: 'Morning Sickness', icon: 'restaurant-outline' },
        { id: 'heartburn', name: 'Heartburn', icon: 'flame-outline' },
        { id: 'fatigue', name: 'Fatigue', icon: 'bed-outline' },
        { id: 'nausea', name: 'Nausea', icon: 'medical-outline' },
        { id: 'bloating', name: 'Bloating', icon: 'ellipse-outline' },
        { id: 'cramps', name: 'Cramps', icon: 'pulse-outline' }
    ] as SymptomOption[]
};

export function getTotalAvailableSymptoms(): number {
    return SYMPTOMS_CONFIG.sexDriveOptions.length +
        SYMPTOMS_CONFIG.moodOptions.length +
        SYMPTOMS_CONFIG.physicalSymptoms.length;
}

export function getAllSymptoms(): SymptomOption[] {
    return [
        ...SYMPTOMS_CONFIG.sexDriveOptions,
        ...SYMPTOMS_CONFIG.moodOptions,
        ...SYMPTOMS_CONFIG.physicalSymptoms
    ];
}
