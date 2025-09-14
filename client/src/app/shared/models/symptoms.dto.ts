export interface SymptomsDto {
    userId: number;
    date: string;
    mood: string;
    energy: string;
    symptoms: SymptomDto[];
    notes: string;
}

export interface SymptomDto {
    category: string;
    icon: string;
    id: string;
    name: string;
    notes: string;
    severity: string;
}

