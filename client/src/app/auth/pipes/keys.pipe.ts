import { Pipe } from '@angular/core';

@Pipe({
  name: 'keys',
  standalone: false,
})
export class KeysPipe {
  transform(obj: any): string[] {
    return Object.keys(obj);
  }
}
