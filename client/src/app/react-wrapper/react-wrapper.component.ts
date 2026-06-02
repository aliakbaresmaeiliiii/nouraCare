import { Component } from '@angular/core';

@Component({
  selector: 'app-react-wrapper',
  template: `
    <div id="react-root"></div>
    @if (loadError) {
      <div class="p-4 text-center text-muted">
        <p>Pregnancy app is not available.</p>
        <p class="small">Start the pregnancy app on port 4202 to use this section.</p>
      </div>
    }
  `,
  styleUrls: ['./react-wrapper.component.scss'],
})
export class ReactWrapperComponent {
  loadError = false;
}
