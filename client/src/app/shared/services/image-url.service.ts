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
    const raw = (imageUrl?.trim() ?? '').replace(/^["']|["']$/g, '');
    if (!raw) {
      return this.fallback;
    }

    if (raw.startsWith('blob:') || raw.startsWith('data:')) {
      return this.fallback;
    }

    // If the API returned an absolute URL but it points to an unreachable host,
    // normalize it to our configured uploads base as long as it's an /uploads/... path.
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      try {
        const parsed = new URL(raw);
        if (parsed.pathname.startsWith('/uploads/')) {
          const base = environment.urlProfileImg.endsWith('/')
            ? environment.urlProfileImg
            : `${environment.urlProfileImg}/`;
          const uploadsRelPath = parsed.pathname.replace(/^\/uploads\//, '');
          return `${base}${uploadsRelPath}`;
        }
      } catch {
        // If URL parsing fails, fall through and return raw.
      }
      return raw;
    }

    const base = environment.urlProfileImg.endsWith('/')
      ? environment.urlProfileImg
      : `${environment.urlProfileImg}/`;
    const path = raw.replace(/^\/+/, '');
    
    return `${base}${path}`;
  }
}
