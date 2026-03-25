import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ImageUrlService {
  private get fallback(): string {
    return environment.profileImageFallback ?? 'assets/images/bg-01.png';
  }

  /**
   * Same idea as:
   *   img ? `${environment.urlProfileImg}${img}` : fallbackAsset
   * Absolute http(s) URLs from API are returned unchanged.
   */
  getImageUrl(imageUrl: string | null | undefined): string {

    const raw = imageUrl?.trim() ?? '';
    if (!raw) {
      return this.fallback;
    }

    if (raw.startsWith('blob:') || raw.startsWith('data:')) {
      return this.fallback;
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }

    const base = environment.urlProfileImg.endsWith('/')
      ? environment.urlProfileImg
      : `${environment.urlProfileImg}/`;
    const path = raw.replace(/^\/+/, '');
    return `${base}${path}`;
  }
}
