import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { CategorySelectionModalComponent, PostCategory } from '@app/shared/ui/category-selection-modal/category-selection-modal.component';
import { PostDetailModalComponent } from '@app/shared/ui/post-detail-modal/post-detail-modal.component';
import { AppButtonComponent } from '@app/shared/ui/app-button/app-button.component';
import { LocalizedNumberPipe } from '@app/shared/pipes/localized-number.pipe';
import { TranslationService } from '@app/shared/services/translation.service';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-create-post-modal',
  templateUrl: './create-post-modal.component.html',
  styleUrls: ['./create-post-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, AppButtonComponent, LocalizedNumberPipe, TranslatePipe]
})
export class CreatePostModalComponent implements OnInit {

  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private translation = inject(TranslationService);

  // Form data
  postContent = '';
  selectedImages: File[] = [];
  isAnonymous = false;
  selectedCategory: PostCategory | null = null;

  // UI state
  isSubmitting = false;
  characterCount = 0;
  maxCharacters = 2000;
  minCharacters = 10;

  ngOnInit() { }

  // Content handling
  onContentChange() {
    this.characterCount = this.postContent.length;
  }

  // Image handling
  onImageSelect(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < Math.min(files.length, 4); i++) { // Max 4 images
        this.selectedImages.push(files[i]);
      }
    }
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
  }

  triggerImageSelect() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => this.onImageSelect(e);
    input.click();
  }

  // Form validation
  canPost(): boolean {
    const trimmed = this.postContent.trim();
    const hasText =
      trimmed.length >= this.minCharacters ||
      (trimmed.length > 0 && this.selectedImages.length > 0);
    return (
      (hasText || this.selectedImages.length > 0) &&
      this.characterCount <= this.maxCharacters
    );
  }

  // Submit post
  submitPost() {
    if (!this.canPost()) {
      this.showToast(this.translation.translate('createPost.toast.addContent'), 'warning');
      return;
    }
    // Show category selection modal first
    this.showCategorySelection();
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
      // Now proceed with posting
      await this.finalizePost();
    } else if (role === 'back') {
      // User went back, stay in create post modal
      return;
    } else {
      // User cancelled, close the create post modal
      await this.modalController.dismiss(null, 'cancel');
    }
  }

  // Finalize the post after category selection
  async finalizePost() {
    this.isSubmitting = true;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const postData = {
        content: this.postContent.trim(),
        images: this.selectedImages,
        isAnonymous: this.isAnonymous,
        category: this.selectedCategory,
        createdAt: new Date()
      };

      // Close create post modal
      await this.modalController.dismiss(postData, 'success');
      
      // Show post detail modal
      await this.showPostDetailModal(postData);

    } catch (error) {
      console.error('Error creating post:', error);
      await this.showToast(this.translation.translate('createPost.toast.createFailed'), 'danger');
    } finally {
      this.isSubmitting = false;
    }
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

  private hasUnsavedChanges(): boolean {
    return this.postContent.trim().length > 0 || this.selectedImages.length > 0;
  }

  private async confirmClose(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const toast = await this.toastController.create({
        message: this.translation.translate('createPost.toast.discardPost'),
        duration: 4000,
        position: 'top',
        color: 'warning',
        buttons: [
          {
            text: this.translation.translate('createPost.toast.keepEditing'),
            handler: () => resolve(false)
          },
          {
            text: this.translation.translate('createPost.toast.discard'),
            handler: () => resolve(true)
          }
        ]
      });
      await toast.present();
    });
  }

  // Helper methods
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
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