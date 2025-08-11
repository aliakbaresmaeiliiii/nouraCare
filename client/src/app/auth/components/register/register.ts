import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Auth } from '../../services/auth';
import { RegisterRequest } from '../../model/register-request-interface';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  fb = inject(FormBuilder);
  // service = inject(Auth);

  items = [
    {
      top: '10%',
      left: '20%',
      image: '../../../../../assets/images/ali.jpg',
      alt: 'Floating Item 1',
    },
    {
      top: '30%',
      left: '50%',
      image: '../../../../../assets/images/ali.jpg',
      alt: 'Floating Item 2',
    },
    {
      top: '70%',
      left: '10%',
      image: '../../../../../assets/images/ali.jpg',
      alt: 'Floating Item 3',
    },
  ];

  rainDrops = Array.from({ length: 100 }, () => ({
    x: Math.random() * 100 + '%',
    y: Math.random() * -100 + '%',
  }));

  title = signal<string>('');
  matcher = new ErrorStateMatcher();
  selectedRole: string = 'patient';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
  });

  setRole(role: string) {
    this.selectedRole = role;
    this.title.set(role);
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: RegisterRequest = {
      email: this.form.value.email,
      phone: this.form.value.phone,
    };
    // this.service.register(payload).subscribe({
    //   next: (res) => {
    //     console.log('Registration successful:', res);
    //   },
    //   error: (err) => {
    //     console.error('Registration failed:', err);
    //   },
    // });
  }

}
