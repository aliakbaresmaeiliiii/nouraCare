export type ConsultationCategoryId =
  | 'women-maternity'
  | 'psychology'
  | 'pediatrics'
  | 'dermatology';

export interface ConsultationCategory {
  id: ConsultationCategoryId;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  /** Marketing / catalog size shown on category cards. */
  displayCount: number;
  gradientFrom: string;
  gradientTo: string;
  /** Passed to doctors API when this category is selected. */
  apiFilter: { specialty?: string; search?: string };
  /** Client-side fallback when API returns broader results. */
  specialtyKeywords: string[];
}

export const CONSULTATION_CATEGORIES: ConsultationCategory[] = [
  {
    id: 'women-maternity',
    titleKey: 'consultation.category.womenMaternity',
    subtitleKey: 'consultation.category.womenMaternityDesc',
    icon: 'female-outline',
    displayCount: 500,
    gradientFrom: '#db2777',
    gradientTo: '#f472b6',
    apiFilter: { specialty: 'Obstetrics' },
    specialtyKeywords: [
      'obstetric',
      'gynecolog',
      'maternal',
      'fertility',
      'prenatal',
      'pregnancy',
      'reproductive',
    ],
  },
  {
    id: 'psychology',
    titleKey: 'consultation.category.psychology',
    subtitleKey: 'consultation.category.psychologyDesc',
    icon: 'heart-outline',
    displayCount: 500,
    gradientFrom: '#7c3aed',
    gradientTo: '#a78bfa',
    apiFilter: { search: 'Psychology' },
    specialtyKeywords: ['psycholog', 'mental', 'counsel', 'therapy'],
  },
  {
    id: 'pediatrics',
    titleKey: 'consultation.category.pediatrics',
    subtitleKey: 'consultation.category.pediatricsDesc',
    icon: 'happy-outline',
    displayCount: 500,
    gradientFrom: '#0891b2',
    gradientTo: '#22d3ee',
    apiFilter: { search: 'Pediatric' },
    specialtyKeywords: ['pediatric', 'child', 'children', 'neonatal'],
  },
  {
    id: 'dermatology',
    titleKey: 'consultation.category.dermatology',
    subtitleKey: 'consultation.category.dermatologyDesc',
    icon: 'sparkles-outline',
    displayCount: 500,
    gradientFrom: '#d97706',
    gradientTo: '#fbbf24',
    apiFilter: { search: 'Dermatolog' },
    specialtyKeywords: ['dermatolog', 'skin', 'hair', 'cosmetic'],
  },
];

export function getConsultationCategory(
  id: string | null | undefined,
): ConsultationCategory | undefined {
  return CONSULTATION_CATEGORIES.find((c) => c.id === id);
}

export function doctorMatchesCategory(
  doctor: { specialty?: string | null },
  categoryId: string,
): boolean {
  const category = getConsultationCategory(categoryId);
  if (!category) {
    return true;
  }
  const spec = doctor.specialty?.toLowerCase() ?? '';
  return category.specialtyKeywords.some((keyword) => spec.includes(keyword));
}
