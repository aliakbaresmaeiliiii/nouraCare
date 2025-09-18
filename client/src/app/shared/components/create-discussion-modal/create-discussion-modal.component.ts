import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';

interface DiscussionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface DiscussionTemplate {
  id: string;
  title: string;
  placeholder: string;
  category: string;
}

@Component({
  selector: 'app-create-discussion-modal',
  templateUrl: './create-discussion-modal.component.html',
  styleUrls: ['./create-discussion-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CreateDiscussionModalComponent implements OnInit {

  private modalController = inject(ModalController);
  private toastController = inject(ToastController);

  // Form data
  discussionTitle = '';
  discussionContent = '';
  selectedCategory: DiscussionCategory | null = null;
  selectedTemplate: DiscussionTemplate | null = null;
  isAnonymous = false;
  allowComments = true;
  notifyReplies = true;

  // UI state
  currentStep = 1; // 1: Category, 2: Template, 3: Write
  isSubmitting = false;
  showEmojiPicker = false;
  characterCount = 0;
  maxCharacters = 2000;

  // Data
  categories: DiscussionCategory[] = [
    {
      id: 'pregnancy',
      name: 'Pregnancy Journey',
      icon: 'heart',
      color: '#ff6b9d',
      description: 'Share your pregnancy experiences and milestones'
    },
    {
      id: 'fertility',
      name: 'Fertility & TTC',
      icon: 'flower',
      color: '#4facfe',
      description: 'Trying to conceive discussions and support'
    },
    {
      id: 'health',
      name: 'Health & Wellness',
      icon: 'fitness',
      color: '#a8edea',
      description: 'Health tips, nutrition, and exercise advice'
    },
    {
      id: 'postpartum',
      name: 'Postpartum Care',
      icon: 'leaf',
      color: '#fed6e3',
      description: 'Recovery, breastfeeding, and new mom life'
    },
    {
      id: 'support',
      name: 'Emotional Support',
      icon: 'people',
      color: '#667eea',
      description: 'Mental health and emotional wellbeing'
    },
    {
      id: 'general',
      name: 'General Chat',
      icon: 'chatbubbles',
      color: '#fbbf24',
      description: 'Casual conversations and community chat'
    }
  ];

  templates: DiscussionTemplate[] = [
    {
      id: 'question',
      title: 'Ask a Question',
      placeholder: 'I have a question about... Can anyone help me understand...',
      category: 'general'
    },
    {
      id: 'experience',
      title: 'Share Experience',
      placeholder: 'I wanted to share my experience with... Today I learned...',
      category: 'general'
    },
    {
      id: 'advice',
      title: 'Seek Advice',
      placeholder: 'I\'m looking for advice on... Has anyone dealt with...',
      category: 'general'
    },
    {
      id: 'milestone',
      title: 'Celebrate Milestone',
      placeholder: 'I\'m excited to share that... Just reached a milestone...',
      category: 'pregnancy'
    },
    {
      id: 'symptom',
      title: 'Discuss Symptoms',
      placeholder: 'I\'ve been experiencing... Is this normal during...',
      category: 'health'
    },
    {
      id: 'support',
      title: 'Need Support',
      placeholder: 'I\'m going through... Could use some encouragement...',
      category: 'support'
    }
  ];

  filteredTemplates: DiscussionTemplate[] = [];

  ngOnInit() {
    this.updateFilteredTemplates();
  }

  // Navigation methods
  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    this.currentStep = step;
  }

  // Category selection
  selectCategory(category: DiscussionCategory) {
    this.selectedCategory = category;
    this.updateFilteredTemplates();
    this.nextStep();
  }

  private updateFilteredTemplates() {
    if (this.selectedCategory) {
      this.filteredTemplates = this.templates.filter(template => 
        template.category === this.selectedCategory!.id || template.category === 'general'
      );
    } else {
      this.filteredTemplates = [...this.templates];
    }
  }

  // Template selection
  selectTemplate(template: DiscussionTemplate) {
    this.selectedTemplate = template;
    this.discussionContent = template.placeholder;
    this.updateCharacterCount();
    this.nextStep();
  }

  skipTemplate() {
    this.selectedTemplate = null;
    this.discussionContent = '';
    this.nextStep();
  }

  // Content editing
  onContentChange() {
    this.updateCharacterCount();
  }

  private updateCharacterCount() {
    this.characterCount = this.discussionContent.length;
  }

  // Emoji functionality
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    this.discussionContent += emoji;
    this.updateCharacterCount();
    this.showEmojiPicker = false;
  }

  // Popular emojis for quick access
  popularEmojis = ['😊', '❤️', '🤗', '😢', '🙏', '💪', '🌟', '🎉', '👶', '🤱', '💕', '✨'];

  // Form validation
  canProceedFromStep1(): boolean {
    return this.selectedCategory !== null;
  }

  canProceedFromStep2(): boolean {
    return true; // Template is optional
  }

  canSubmit(): boolean {
    return this.discussionTitle.trim().length > 0 && 
           this.discussionContent.trim().length > 0 && 
           this.characterCount <= this.maxCharacters &&
           this.selectedCategory !== null;
  }

  // Submit discussion
  async submitDiscussion() {
    if (!this.canSubmit()) {
      await this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    this.isSubmitting = true;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const discussionData = {
        title: this.discussionTitle.trim(),
        content: this.discussionContent.trim(),
        category: this.selectedCategory!,
        template: this.selectedTemplate,
        isAnonymous: this.isAnonymous,
        allowComments: this.allowComments,
        notifyReplies: this.notifyReplies,
        createdAt: new Date()
      };

      // Close modal with success data
      await this.modalController.dismiss(discussionData, 'success');
      await this.showToast('Discussion posted successfully! 🎉', 'success');

    } catch (error) {
      console.error('Error creating discussion:', error);
      await this.showToast('Failed to post discussion. Please try again.', 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  // Modal actions
  async closeModal() {
    if (this.hasUnsavedChanges()) {
      // Show confirmation dialog
      const shouldClose = await this.confirmClose();
      if (shouldClose) {
        await this.modalController.dismiss(null, 'cancel');
      }
    } else {
      await this.modalController.dismiss(null, 'cancel');
    }
  }

  private hasUnsavedChanges(): boolean {
    return this.discussionTitle.trim().length > 0 || 
           this.discussionContent.trim().length > 0;
  }

  private async confirmClose(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const toast = await this.toastController.create({
        message: 'You have unsaved changes. Are you sure you want to close?',
        duration: 4000,
        position: 'top',
        color: 'warning',
        buttons: [
          {
            text: 'Keep Writing',
            handler: () => resolve(false)
          },
          {
            text: 'Discard',
            handler: () => resolve(true)
          }
        ]
      });
      await toast.present();
    });
  }

  // Helper methods
  getStepProgress(): number {
    return (this.currentStep / 3) * 100;
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Choose Category';
      case 2: return 'Pick Template';
      case 3: return 'Write Discussion';
      default: return 'Create Discussion';
    }
  }

  getStepDescription(): string {
    switch (this.currentStep) {
      case 1: return 'What topic would you like to discuss?';
      case 2: return 'Get started with a template (optional)';
      case 3: return 'Share your thoughts with the community';
      default: return '';
    }
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Quick actions
  clearContent() {
    this.discussionContent = '';
    this.updateCharacterCount();
  }

  focusTitle() {
    setTimeout(() => {
      const titleInput = document.querySelector('#discussion-title') as HTMLInputElement;
      if (titleInput) {
        titleInput.focus();
      }
    }, 100);
  }

  focusContent() {
    setTimeout(() => {
      const contentTextarea = document.querySelector('#discussion-content') as HTMLTextAreaElement;
      if (contentTextarea) {
        contentTextarea.focus();
      }
    }, 100);
  }
}