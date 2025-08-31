import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageUrlService {
  
  /**
   * Ensures the image URL has the correct base URL
   * @param imageUrl - The image URL (can be relative or absolute)
   * @returns The complete image URL
   */
  getImageUrl(imageUrl: string | null): string {
    if (!imageUrl) {
      return 'https://ionicframework.com/docs/img/demos/avatar.svg';
    }
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative URL starting with /uploads/, prepend the server URL
    if (imageUrl.startsWith('/uploads/')) {
      return `${environment.urlProfileImg.replace('/uploads/', '')}${imageUrl}`;
    }
    
    // If it's just a filename, construct the full path
    return `${environment.urlProfileImg}profile/${imageUrl}`;
  }
}
