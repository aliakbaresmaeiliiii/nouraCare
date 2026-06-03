import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import { DoctorDto } from '../../models/doctor.dto';
import { DoctorDisplayService } from '../../services/doctor-display.service';

@Component({
  selector: 'app-doctor-avatar',
  standalone: true,
  templateUrl: './doctor-avatar.component.html',
  styleUrls: ['./doctor-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorAvatarComponent {
  @Input({ required: true }) doctor!: DoctorDto;
  @Input() alt = '';
  @Input() size: 'sm' | 'list' | 'md' | 'lg' | 'hero' = 'md';
  @Input() loading: 'lazy' | 'eager' = 'lazy';

  readonly doctorDisplay = inject(DoctorDisplayService);

  get avatarSrc(): string {
    return this.doctorDisplay.getAvatar(this.doctor);
  }

  get avatarAlt(): string {
    return this.alt || this.doctor.fullName || '';
  }
}
