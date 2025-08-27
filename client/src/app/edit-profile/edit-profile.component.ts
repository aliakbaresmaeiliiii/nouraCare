import { Component, OnInit, signal } from '@angular/core';
import { addIcons } from 'ionicons';
import { pencil, star } from 'ionicons/icons';
import { SharedModule } from '../shared/shared-module';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  imports: [SharedModule],
})
export class EditProfileComponent implements OnInit {
  profileImage: string | null = null;
  selectedProfile: File | null = null;
  showPickerMenstrualPicker = false;
  showPickerPeriodUsually = false;
  daysMenstrualCycle: number[] = Array.from({ length: 41 }, (_, i) => i + 20);
  tempPeriodDays: number[] = Array.from({ length: 8 }, (_, i) => i + 3);
  tempCycleDays = signal<number>(20);
  menstrualCycleDays = signal<number>(20);

  temUsualPeriodDays = signal<number>(3);
  usualPeriodDays = signal<number>(3);

  constructor() {
    addIcons({ pencil, star });
  }

  ngOnInit() {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  openPickerMenstrualCycle(){
    this.showPickerMenstrualPicker = true;

  }

   closePeriodSheet() {
    this.showPickerMenstrualPicker = false;
  }


  onChangeMenstrualCycle(event: any) {
    this.tempCycleDays.set(event.detail.value);
  }

  confirmPickerMenstrualCycle() {
    this.menstrualCycleDays.set(this.tempCycleDays());
    this.showPickerMenstrualPicker = false;
  }

  cancelPickerMenstrualCycle() {
    this.showPickerMenstrualPicker = false;
  }

  onChangetemUsualPeriod(event: any) {
    // just store temporary value
    this.temUsualPeriodDays.set(event.detail.value);
  }

  confirmUsualPeriodDays() {
    this.usualPeriodDays.set(this.temUsualPeriodDays()); // update state only here
    this.showPickerPeriodUsually = false;
  }

  cancelPickerPeriodUsually() {
    this.showPickerPeriodUsually = false;
  }
}
