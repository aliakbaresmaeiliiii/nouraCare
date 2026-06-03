import { inject, Injectable } from '@angular/core';
import { ConsultationType, DoctorDto } from '../models/doctor.dto';
import { formatDoctorFee } from '../utils/locale-date-format.util';
import { LanguageService } from './language.service';
import { TranslationService } from './translation.service';

/** Canonical specialty values stored on doctor records (English). */
export const DOCTOR_SPECIALTIES = [
  'Obstetrics & Gynecology',
  'Maternal-Fetal Medicine',
  'Reproductive Endocrinology',
  'Fertility Specialist',
  'Prenatal Care',
  'High-Risk Pregnancy',
] as const;

const SPECIALTY_TRANSLATION_KEYS: Record<string, string> = {
  'Obstetrics & Gynecology': 'doctor.specialty.obstetricsGynecology',
  'Maternal-Fetal Medicine': 'doctor.specialty.maternalFetalMedicine',
  'Reproductive Endocrinology': 'doctor.specialty.reproductiveEndocrinology',
  'Fertility Specialist': 'doctor.specialty.fertilitySpecialist',
  'Prenatal Care': 'doctor.specialty.prenatalCare',
  'High-Risk Pregnancy': 'doctor.specialty.highRiskPregnancy',
};

const LOCATION_TRANSLATION_KEYS: Record<string, string> = {
  Tehran: 'doctor.location.tehran',
  Shiraz: 'doctor.location.shiraz',
  Mashhad: 'doctor.location.mashhad',
  Isfahan: 'doctor.location.isfahan',
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

const SEED_ABOUT_PATTERN =
  /^Board-certified specialist in (.+)\. Seed profile #(\d+) for development and demos\.$/;

const WELLNESS_CLINIC_PATTERN = /^Wellness Clinic (\d+)$/;

@Injectable({
  providedIn: 'root',
})
export class DoctorDisplayService {
  private readonly translation = inject(TranslationService);
  private readonly language = inject(LanguageService);
  private readonly avatarWomenPath = 'assets/images/avatarWomen.png';
  private readonly avatarMenPath = 'assets/images/avatarMan.png';

  getAvatar(doctor: DoctorDto): string {
    if (this.hasRealProfileImage(doctor.profileImageUrl)) {
      return doctor.profileImageUrl!.trim();
    }

    const seed = `${doctor.id ?? ''}${doctor.fullName ?? ''}`.toLowerCase().trim();
    if (!seed) {
      return this.avatarWomenPath;
    }
    const codeSum = Array.from(seed).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return codeSum % 2 === 0 ? this.avatarWomenPath : this.avatarMenPath;
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
    if (!about) {
      return '';
    }

    const seedMatch = about.match(SEED_ABOUT_PATTERN);
    if (seedMatch) {
      const [, specialtyEn, number] = seedMatch;
      return this.translation.translateParams('doctor.about.seed', {
        specialty: this.getSpecialtyLabel(specialtyEn),
        number,
      });
    }

    return about;
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
