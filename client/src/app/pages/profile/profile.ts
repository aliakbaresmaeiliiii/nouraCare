import { ChangeDetectorRef, Component, inject, Input, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit{
  percent: number = 0;
  cdr = inject(ChangeDetectorRef);

  userInfo = signal<any[]>([
    {
      friends: 20,
      Question: 50,
      Answers: 30,
      Benefits: 40,
    },
  ]);
  constructor(){
    this.percent = 80;

  }

  ngOnInit(): void {
  }


}
