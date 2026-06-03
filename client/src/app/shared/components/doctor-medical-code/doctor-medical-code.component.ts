import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { idCardOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { DoctorDto } from '../../models/doctor.dto';
import { DoctorDisplayService } from '../../services/doctor-display.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type DoctorMedicalCodeVariant = 'chip' | 'hero' | 'inline' | 'row';

@Component({
  selector: 'app-doctor-medical-code',
  standalone: true,
  imports: [IonIcon, TranslatePipe],
  templateUrl: './doctor-medical-code.component.html',
  styleUrls: ['./doctor-medical-code.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorMedicalCodeComponent {
  @Input() doctor?: Pick<DoctorDto, 'licenseNumber'>;
  @Input() licenseNumber?: string | null;
  @Input() variant: DoctorMedicalCodeVariant = 'chip';

  readonly doctorDisplay = inject(DoctorDisplayService);

  constructor() {
    addIcons({ idCardOutline, shieldCheckmarkOutline });
  }

  get code(): string {
    const raw = this.licenseNumber ?? this.doctor?.licenseNumber;
    return this.doctorDisplay.formatMedicalCouncilCode(raw);
  }

  get visible(): boolean {
    const raw = this.licenseNumber ?? this.doctor?.licenseNumber;
    return this.doctorDisplay.hasMedicalCouncilCode({ licenseNumber: raw ?? undefined });
  }
}
