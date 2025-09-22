import { Component, OnInit, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, ActionSheetController, AlertController } from '@ionic/angular';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, map, catchError, finalize } from 'rxjs/operators';
import { CategorySelectionModalComponent } from '../category-selection-modal/category-selection-modal.component';
import { PostDetailModalComponent } from '../post-detail-modal/post-detail-modal.component';
import { PostCategory, CreatePostDto, CreatePostMediaDto, MediaType } from 'src/app/secret-chats/secret.chats.dto';
import { SecretChatsService } from 'src/app/secret-chats/services/secret-chat.service';
import { AuthService } from 'src/app/auth/services/auth';

interface MediaFile {
  file: File;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT',
  size: number;
  name: string;
}

@Component({
  selector: 'app-create-post-modal',
  templateUrl: './create-post-modal.component.html',
  styleUrls: ['./create-post-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CreatePostModalComponent implements OnInit {

  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private actionSheetController = inject(ActionSheetController);
  private alertController = inject(AlertController);
  private secretChatsService = inject(SecretChatsService);

  // Input properties - passed from parent component (using signals)
  selectedChatId = 'general-feed'; // Default fallback
  selectedChatName = ''; // Chat display name
  availableChats = []; // All available chats
  currentUser = null; // Optional user data
  currentUserRole = ''; // User's role in the chat
  allowedCategories = input<PostCategory[]>([]); // Optional category filter

  // Form data
  postContent = '';
  selectedMedia = signal<MediaFile[]>([]);
  isAnonymous = false; 
  selectedCategory: PostCategory | null = null;

  // UI state
  isSubmitting = false;
  uploadProgress = signal(0);
  uploadingMedia = signal(false);
  characterCount = 0;
  maxCharacters = 2000;
  maxMediaFiles = 4;
  maxFileSize = 50 * 1024 * 1024; // 50MB
  currentMediaIndex = 0;
  private authService = inject(AuthService);
  // Touch/swipe handling
  private touchStartX = 0;
  private touchStartY = 0;
  private minSwipeDistance = 50;

  // Media constraints
  allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  
  // Make MediaType enum available in template
  MediaType = MediaType;

  ngOnInit() {
    // Validate user permissions
    if (this.currentUserRole === 'NOT_MEMBER') {
      console.warn('⚠️ User is not a member of this chat');
      this.showToast('You are not a member of this chat', 'warning');
      this.closeModal();
    }
  }

  // Content handling
  onContentChange() {
    this.characterCount = this.postContent.length;
  }

  // Media handling
  async showMediaOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Add Media',
      cssClass: 'media-action-sheet',
      buttons: [
        {
          text: 'Camera',
          icon: 'camera',
          handler: () => {
            this.openCamera();
          }
        },
        {
          text: 'Photo Library',
          icon: 'images',
          handler: () => {
            this.selectFromGallery('image');
          }
        },
        {
          text: 'Video Library',
          icon: 'videocam',
          handler: () => {
            this.selectFromGallery('video');
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async openCamera() {
    // For now, fallback to file input - in real app you'd use Capacitor Camera plugin
    this.selectFromGallery('image');
  }

  selectFromGallery(type: 'image' | 'video') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? this.allowedImageTypes.join(',') : this.allowedVideoTypes.join(',');
    input.multiple = true;
    input.onchange = (e) => this.onMediaSelect(e, type);
    input.click();
  }

  onMediaSelect(event: any, expectedType: 'image' | 'video') {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentMedia = this.selectedMedia();
    const remainingSlots = this.maxMediaFiles - currentMedia.length;

    if (remainingSlots <= 0) {
      this.showToast(`Maximum ${this.maxMediaFiles} files allowed`, 'warning');
      return;
    }

    const filesToProcess = Math.min(files.length, remainingSlots);
    const newMedia: MediaFile[] = [];

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];

      // Validate file type
      const isValidImage = this.allowedImageTypes.includes(file.type);
      const isValidVideo = this.allowedVideoTypes.includes(file.type);

      if (!isValidImage && !isValidVideo) {
        this.showToast(`${file.name} is not a supported file type`, 'warning');
        continue;
      }

      // Validate file size
      if (file.size > this.maxFileSize) {
        this.showToast(`${file.name} is too large (max 50MB)`, 'warning');
        continue;
      }

      const mediaType: MediaType = isValidImage ? MediaType.IMAGE : MediaType.VIDEO;
      const url = URL.createObjectURL(file);

      newMedia.push({
        file,
        url,
        type: mediaType as MediaType,
        size: file.size,
        name: file.name
      });
    }

    if (newMedia.length > 0) {
      this.selectedMedia.set([...currentMedia, ...newMedia]);
    }
  }

  removeMedia(index: number) {
    const currentMedia = this.selectedMedia();
    const mediaToRemove = currentMedia[index];

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(mediaToRemove.url);

    const updatedMedia = currentMedia.filter((_, i) => i !== index);
    this.selectedMedia.set(updatedMedia);

    // Adjust current index if needed
    if (this.currentMediaIndex >= updatedMedia.length && updatedMedia.length > 0) {
      this.currentMediaIndex = updatedMedia.length - 1;
    } else if (updatedMedia.length === 0) {
      this.currentMediaIndex = 0;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Media carousel navigation
  nextMedia() {
    const mediaLength = this.selectedMedia().length;
    if (this.currentMediaIndex < mediaLength - 1) {
      this.currentMediaIndex++;
    }
  }

  previousMedia() {
    if (this.currentMediaIndex > 0) {
      this.currentMediaIndex--;
    }
  }

  goToMedia(index: number) {
    const mediaLength = this.selectedMedia().length;
    if (index >= 0 && index < mediaLength) {
      this.currentMediaIndex = index;
    }
  }

  // Touch/swipe handling
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchMove(event: TouchEvent) {
    // Prevent default scrolling while swiping
    if (this.selectedMedia().length > 1) {
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (this.selectedMedia().length <= 1) return;

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;

    // Only process horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        this.previousMedia();
      } else {
        // Swipe left - go to next
        this.nextMedia();
      }
    }
  }

  // Form validation
  canPost(): boolean {
    return (this.postContent.trim().length > 0 || this.selectedMedia().length > 0) &&
      this.characterCount <= this.maxCharacters &&
      this.selectedCategory !== null &&
      !this.isSubmitting;
  }

  // Submit post - now directly posts since category is required
  async submitPost() {
    if (!this.canPost()) {
      // if (!this.selectedCategory) {
      //   this.showToast('Please select a category first', 'warning');
      //   return;
      // }
      // this.showToast('Please add some content to your post', 'warning');
      // return;
    }

    // Show final confirmation dialog
    await this.showFinalPostConfirmation();
  }

  async showFinalPostConfirmation() {
    const mediaCount = this.selectedMedia().length;
    const mediaText = mediaCount > 0 ? ` with ${mediaCount} ${mediaCount === 1 ? 'file' : 'files'}` : '';

    const alert = await this.alertController.create({
      header: 'Share Your Post',
      message: `Ready to share in "${this.selectedCategory?.name}"${mediaText}?`,
      cssClass: 'ios-modern-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Share Now',
          cssClass: 'primary',
          handler: () => {
            this.finalizePost();
          }
        }
      ]
    });

    await alert.present();
  }

  // Show category selection modal
  async showCategorySelection() {
    const modal = await this.modalController.create({
      component: CategorySelectionModalComponent,
      cssClass: 'category-selection-modal',
      backdropDismiss: false
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.selectedCategory = data;
      this.showToast(`Category "${data.name}" selected! 🎯`, 'success');
    } else if (role === 'back') {
      // User went back, stay in create post modal
      return;
    }
    // If cancelled, just return to create post modal
  }

  // Finalize the post after category selection
  finalizePost() {
    this.isSubmitting = true;
    
    const mediaFiles = this.selectedMedia();
    
    // Create the upload stream (if media exists)
    const uploadStream$ = mediaFiles.length > 0 
      ? this.uploadMediaFiles(mediaFiles)
      : of([]);

    uploadStream$.pipe(
      switchMap((uploadedMediaUrls: string[]) => {
        // Prepare media data for post creation (direct array for backend service)
        const mediaData = uploadedMediaUrls.length > 0 
          ? uploadedMediaUrls.map((url, index) => ({
              url,
              type: mediaFiles[index].type as MediaType,
              caption: '', // You can add caption support later
              order: index,
              size: mediaFiles[index].size,
              filename: mediaFiles[index].name
            }))
          : undefined;
        
        // Create post data
        const postData: CreatePostDto = {
          content: this.postContent.trim(),
          chatId: this.selectedChatId, // Now properly passed from parent
          categoryId: this.selectedCategory?.id || undefined, // Send undefined instead of null
          isAnonymous: this.isAnonymous,
          media: mediaData,
          id: this.authService.getUserInfo()?.id,
          // Add userId if available (you might need to get this from auth service)
          // userId: this.authService.getCurrentUserId(), // Uncomment when you have auth
        };

        // Debug: Log the post data being sent
        console.log('📤 Sending post data to backend:', JSON.stringify(postData, null, 2));
        console.log('📊 Post data details:', {
          contentLength: postData.content?.length || 0,
          chatId: postData.chatId,
          categoryId: postData.categoryId,
          mediaCount: postData.media?.length || 0,
          isAnonymous: postData.isAnonymous,
          userId: postData.id,
          mediaDetails: postData.media?.map(m => ({ url: m.url, type: m.type, size: m.size }))
        });

        // Validate required fields
        if (!postData.chatId) {
          console.error('❌ Missing chatId');
          throw new Error('Chat ID is required');
        }
        if (!postData.content && (!postData.media || postData.media.length === 0)) {
          console.error('❌ No content or media');
          throw new Error('Post must have content or media');
        }


        // Submit post to API
        return this.secretChatsService.createPost(postData);
      }),
      finalize(() => {
        this.isSubmitting = false;
        this.uploadingMedia.set(false);
      })
    ).subscribe({
      next: (createdPost) => {
        console.log('Post created successfully:', createdPost);
        
        // Show success message
        this.showToast('Post shared successfully! 🎉', 'success');
        
        // Clean up object URLs
        mediaFiles.forEach(media => URL.revokeObjectURL(media.url));
        
        // Show post detail modal if needed
        if (createdPost) {
          this.showPostDetailModal(createdPost);
        }
        
        // Close create post modal with success data
        this.modalController.dismiss({
          post: createdPost,
          success: true
        }, 'success');
      },
      error: (error) => {
        console.error('❌ Error creating post:', error);
        console.error('📋 Full error object:', JSON.stringify(error, null, 2));
        console.error('📋 Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url || 'Unknown URL',
          timestamp: new Date().toISOString()
        });

        // Log the request that failed
        console.error('📋 Failed request data:', {
          chatId: this.selectedChatId,
          hasContent: !!this.postContent?.trim(),
          mediaCount: this.selectedMedia().length,
          category: this.selectedCategory?.id,
          isAnonymous: this.isAnonymous
        });
        
        // Show more specific error message
        let errorMessage = 'Failed to create post. Please try again.';
        if (error.status === 500) {
          errorMessage = 'Server error. Check console for details.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid post data. Please check your input.';
        } else if (error.status === 401) {
          errorMessage = 'Please log in to create posts.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to post in this chat.';
        } else if (error.status === 404) {
          errorMessage = 'Chat not found. Please refresh and try again.';
        }
        
        this.showToast(errorMessage, 'danger');
      }
    });
  }

  private uploadMediaFiles(mediaFiles: MediaFile[]): Observable<string[]> {
    this.uploadingMedia.set(true);
    this.uploadProgress.set(0);
    
    // Show upload progress toast
    this.showToast(`Uploading ${mediaFiles.length} media file(s)...`, 'tertiary');
    
    const files = mediaFiles.map(media => media.file);
    
    return this.secretChatsService.uploadMultipleMedia(files).pipe(
      map(uploadResults => {
        const urls = uploadResults?.map(result => result.url) || [];
        this.uploadProgress.set(100);
        this.showToast(`${urls.length} media files uploaded successfully`, 'success');
        return urls;
      }),
      catchError(uploadError => {
        console.error('Media upload failed:', uploadError);
        this.showToast('Failed to upload media files', 'danger');
        return throwError(() => uploadError);
      })
    );
  }



  // Show post detail modal
  async showPostDetailModal(postData: any) {
    const modal = await this.modalController.create({
      component: PostDetailModalComponent,
      cssClass: 'post-detail-modal-wrapper',
      backdropDismiss: false,
      componentProps: {
        postData: postData
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'back') {
      // User went back, could show create post modal again if needed
      console.log('User went back from post detail');
    }
  }

  // Modal actions
  async closeModal() {
    if (this.hasUnsavedChanges()) {
      const shouldClose = await this.confirmClose();
      if (shouldClose) {
        await this.modalController.dismiss(null, 'cancel');
      }
    } else {
      await this.modalController.dismiss(null, 'cancel');
    }
  }

  hasUnsavedChanges(): boolean {
    return this.postContent.trim().length > 0 || this.selectedMedia().length > 0;
  }

  private async confirmClose(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Discard Changes?',
        message: 'Your post will be lost if you continue.',
        cssClass: 'ios-modern-alert',
        buttons: [
          {
            text: 'Keep Editing',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Discard',
            cssClass: 'destructive',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }

  // Helper methods
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      cssClass: 'ios-modern-toast',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  // Cleanup on destroy
  ngOnDestroy() {
    // Clean up object URLs to prevent memory leaks
    this.selectedMedia().forEach(media => {
      URL.revokeObjectURL(media.url);
    });
  }

  // Focus textarea
  focusTextarea() {
    setTimeout(() => {
      const textarea = document.querySelector('#post-content') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    }, 300);
  }
}