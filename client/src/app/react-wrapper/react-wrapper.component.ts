import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-react-wrapper',
  template: '<div id="react-root"></div>',
  styleUrls: ['./react-wrapper.component.scss'],
})
export class ReactWrapperComponent implements OnInit {
  constructor() {}
  
  async ngOnInit() {
    const module = await import('pregnancyApp/App');
    module.mount(document.getElementById('react-root'));
  }
}
