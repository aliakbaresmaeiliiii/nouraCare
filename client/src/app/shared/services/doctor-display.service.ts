import { inject, Injectable } from '@angular/core';
import { ConsultationType, DoctorDto } from '@app/shared/models/doctor.dto';
import { formatDoctorFee, formatLocalizedNumber } from '@app/shared/utils/locale-date-format.util';
import { ImageUrlService } from '@app/shared/services/image-url.service';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';

/** Canonical specialty values stored on doctor records (English). */
export const DOCTOR_SPECIALTIES = [
  'Obstetrics & Gynecology',
  'Maternal-Fetal Medicine',
  'Reproductive Endocrinology',
  'Fertility Specialist',
  'Prenatal Care',
  'High-Risk Pregnancy',
  'Pediatrics',
  'Neonatology',
  'Midwifery',
  'Lactation Consultant',
  'Perinatal Psychiatry',
  'Genetic Counseling',
  'Obstetric Anesthesiology',
  "Women's Health Nutrition",
  'Pelvic Floor Physical Therapy',
  'Pediatric Cardiology',
  'Endocrinology',
  'Dermatology',
  'Clinical Psychology',
  'Radiology',
  'Ultrasound Specialist',
  'General Practice',
  'Internal Medicine',
  'Urology',
  'Infectious Disease',
  'Emergency Medicine',
] as const;

const SPECIALTY_TRANSLATION_KEYS: Record<string, string> = {
  'Obstetrics & Gynecology': 'doctor.specialty.obstetricsGynecology',
  'Maternal-Fetal Medicine': 'doctor.specialty.maternalFetalMedicine',
  'Reproductive Endocrinology': 'doctor.specialty.reproductiveEndocrinology',
  'Fertility Specialist': 'doctor.specialty.fertilitySpecialist',
  'Prenatal Care': 'doctor.specialty.prenatalCare',
  'High-Risk Pregnancy': 'doctor.specialty.highRiskPregnancy',
  Pediatrics: 'doctor.specialty.pediatrics',
  Neonatology: 'doctor.specialty.neonatology',
  Midwifery: 'doctor.specialty.midwifery',
  'Lactation Consultant': 'doctor.specialty.lactationConsultant',
  'Perinatal Psychiatry': 'doctor.specialty.perinatalPsychiatry',
  'Genetic Counseling': 'doctor.specialty.geneticCounseling',
  'Obstetric Anesthesiology': 'doctor.specialty.obstetricAnesthesiology',
  "Women's Health Nutrition": 'doctor.specialty.womensHealthNutrition',
  'Pelvic Floor Physical Therapy': 'doctor.specialty.pelvicFloorPhysicalTherapy',
  'Pediatric Cardiology': 'doctor.specialty.pediatricCardiology',
  Endocrinology: 'doctor.specialty.endocrinology',
  Dermatology: 'doctor.specialty.dermatology',
  'Clinical Psychology': 'doctor.specialty.clinicalPsychology',
  Radiology: 'doctor.specialty.radiology',
  'Ultrasound Specialist': 'doctor.specialty.ultrasoundSpecialist',
  'General Practice': 'doctor.specialty.generalPractice',
  'Internal Medicine': 'doctor.specialty.internalMedicine',
  Urology: 'doctor.specialty.urology',
  'Infectious Disease': 'doctor.specialty.infectiousDisease',
  'Emergency Medicine': 'doctor.specialty.emergencyMedicine',
};

const LOCATION_TRANSLATION_KEYS: Record<string, string> = {
  Tehran: 'doctor.location.tehran',
  Shiraz: 'doctor.location.shiraz',
  Mashhad: 'doctor.location.mashhad',
  Isfahan: 'doctor.location.isfahan',
  Tabriz: 'doctor.location.tabriz',
  Karaj: 'doctor.location.karaj',
  Ahvaz: 'doctor.location.ahvaz',
  Qom: 'doctor.location.qom',
  Kerman: 'doctor.location.kerman',
  Rasht: 'doctor.location.rasht',
  'New York, NY': 'doctor.location.newYork',
  'Los Angeles, CA': 'doctor.location.losAngeles',
};

const PLACEHOLDER_IMAGE_FRAGMENTS = [
  'user-avatar.png',
  'avatarmen.png',
  'avatarman.png',
  'avatarwomen.png',
  'bg-01.png',
];

const SEED_ABOUT_PATTERNS = [
  /^Board-certified specialist in (.+)\. Seed profile #(\d+) for development and demos\.$/i,
  /^Board-certified specialist in (.+)\. Profile #(\d+)\.$/i,
  /^Board-certified specialist in (.+)\. Seed profile #(\d+)\.$/i,
];

const ENGLISH_PLACEHOLDER_ABOUT =
  /board-certified|seed profile|development and demos|profile #\d+/i;

const PERSIAN_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

const WELLNESS_CLINIC_PATTERN = /^Wellness Clinic (\d+)$/;

@Injectable({
  providedIn: 'root',
})
export class DoctorDisplayService {
  private readonly translation = inject(TranslationService);
  private readonly language = inject(LanguageService);
  private readonly imageUrl = inject(ImageUrlService);

  getAvatar(doctor: Pick<DoctorDto, 'id' | 'fullName' | 'profileImageUrl'>): string {
    if (this.hasRealProfileImage(doctor.profileImageUrl)) {
      return this.imageUrl.getImageUrl(doctor.profileImageUrl);
    }

    const seed = `${doctor.id ?? ''}${doctor.fullName ?? ''}`.toLowerCase().trim();
    if (!seed) {
      return buildDoctorAvatarSvg('#7c3aed', '#c4b5fd');
    }
    const codeSum = Array.from(seed).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return codeSum % 2 === 0
      ? buildDoctorAvatarSvg('#db2777', '#f9a8d4')
      : buildDoctorAvatarSvg('#2563eb', '#93c5fd');
  }

  getSpecialtyLabel(specialty?: string | null): string {
    const raw = specialty?.trim();
    if (!raw) {
      return '';
    }
    const key = SPECIALTY_TRANSLATION_KEYS[raw];
    return key ? this.translation.translate(key) : raw;
  }

  getAboutText(doctor: DoctorDto): string {
    const about = doctor.about?.trim();
    const lang = this.language.getCurrentLanguage();

    if (about && this.containsPersianScript(about)) {
      return about;
    }

    if (about && this.isEnglishSeedOrPlaceholderAbout(about)) {
      return this.buildSeedAbout(doctor, this.extractSeedSpecialty(about));
    }

    if (lang === 'fa') {
      return this.buildDefaultAbout(doctor);
    }

    if (about) {
      return about;
    }

    return this.buildDefaultAbout(doctor);
  }

  getAboutExcerpt(doctor: DoctorDto, maxLen = 100): string {
    const text = this.getAboutText(doctor);
    if (text.length <= maxLen) {
      return text;
    }
    return `${text.substring(0, maxLen)}...`;
  }

  getLocationLabel(location?: string | null): string {
    const raw = location?.trim();
    if (!raw) {
      return '';
    }
    const key = LOCATION_TRANSLATION_KEYS[raw];
    return key ? this.translation.translate(key) : raw;
  }

  getClinicLabel(clinicName?: string | null): string {
    const raw = clinicName?.trim();
    if (!raw) {
      return '';
    }

    const clinicMatch = raw.match(WELLNESS_CLINIC_PATTERN);
    if (clinicMatch) {
      return this.translation.translateParams('doctor.clinic.wellness', {
        number: clinicMatch[1],
      });
    }

    return raw;
  }

  getConsultationTypeLabel(type?: ConsultationType | string | null): string {
    switch (type) {
      case ConsultationType.ONLINE:
      case 'ONLINE':
        return this.translation.translate('consultation.type.onlineOnly');
      case ConsultationType.IN_PERSON:
      case 'IN_PERSON':
        return this.translation.translate('consultation.type.inPersonOnly');
      case ConsultationType.BOTH:
      case 'BOTH':
        return this.translation.translate('consultation.type.both');
      default:
        return this.translation.translate('consultation.type.contactForDetails');
    }
  }

  getShortConsultationTypeLabel(type?: ConsultationType | string | null): string {
    switch (type) {
      case ConsultationType.ONLINE:
      case 'ONLINE':
        return this.translation.translate('doctors.consultationType.online');
      case ConsultationType.IN_PERSON:
      case 'IN_PERSON':
        return this.translation.translate('doctors.consultationType.inPerson');
      case ConsultationType.BOTH:
      case 'BOTH':
        return this.translation.translate('doctors.consultationType.both');
      default:
        return this.translation.translate('doctors.consultationType.available');
    }
  }

  getExperienceLabel(years: number): string {
    return this.translation.translateParams('consultation.yearsExperience', { years });
  }

  formatFee(fee?: number | null): string {
    if (fee == null || fee <= 0) {
      return '';
    }
    return formatDoctorFee(fee, this.language.getCurrentLanguage());
  }

  getMedicalCouncilCodeLabel(): string {
    return this.translation.translate('doctorProfile.medicalCouncilCode');
  }

  formatMedicalCouncilCode(code?: string | null): string {
    const raw = code?.trim();
    if (!raw) {
      return '';
    }
    return formatLocalizedNumber(raw, this.language.getCurrentLanguage());
  }

  hasMedicalCouncilCode(doctor: Pick<DoctorDto, 'licenseNumber'>): boolean {
    return !!doctor.licenseNumber?.trim();
  }

  private containsPersianScript(text: string): boolean {
    return PERSIAN_SCRIPT.test(text);
  }

  private isEnglishSeedOrPlaceholderAbout(text: string): boolean {
    return SEED_ABOUT_PATTERNS.some((pattern) => pattern.test(text)) || ENGLISH_PLACEHOLDER_ABOUT.test(text);
  }

  private extractSeedSpecialty(about: string): string | undefined {
    for (const pattern of SEED_ABOUT_PATTERNS) {
      const match = about.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  private buildSeedAbout(doctor: DoctorDto, specialtyFromAbout?: string): string {
    const specialty = specialtyFromAbout
      ? this.getSpecialtyLabel(specialtyFromAbout)
      : this.getSpecialtyLabel(doctor.specialty);
    return this.translation.translateParams('doctor.about.seed', {
      specialty,
      years: String(doctor.experienceYears ?? 0),
    });
  }

  private buildDefaultAbout(doctor: DoctorDto): string {
    return this.translation.translateParams('doctor.about.default', {
      specialty: this.getSpecialtyLabel(doctor.specialty),
      years: String(doctor.experienceYears ?? 0),
    });
  }

  private hasRealProfileImage(url?: string | null): boolean {
    const raw = url?.trim();
    if (!raw) {
      return false;
    }
    const lower = raw.toLowerCase();
    if (lower.startsWith('blob:') || lower.startsWith('data:')) {
      return false;
    }
    return !PLACEHOLDER_IMAGE_FRAGMENTS.some((fragment) => lower.includes(fragment));
  }
}

function buildDoctorAvatarSvg(accent: string, soft: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${soft}"/><stop offset="100%" stop-color="${accent}"/></linearGradient></defs><circle cx="60" cy="60" r="60" fill="url(#g)"/><circle cx="60" cy="46" r="22" fill="rgba(255,255,255,0.92)"/><path d="M24 98c6-18 22-28 36-28s30 10 36 28" fill="rgba(255,255,255,0.92)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
