import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonicModule,
  ModalController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ForumThreadsService } from '../../shared/services/forum-threads.service';
import { ForumService } from '../../shared/services/forum.service';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface CreatePostForm {
  title: string;
  content: string;
  categoryId: string;
  tags: string[];
}

@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
})
export class CreatePostComponent implements OnInit {
  // Dependency injection
  private navCtrl = inject(NavController);
  private forumThreadsService = inject(ForumThreadsService);
  private forumService = inject(ForumService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private fb = inject(FormBuilder);

  // Component state
  categories = signal<ForumCategory[]>([]);
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  currentTag = '';
  selectedTags: string[] = [];
  characterCount = 0;
  maxContentLength = 5000;

  // Popular tags for suggestions
  popularTags = [
    'period',
    'cramps',
    'pregnancy',
    'fertility',
    'mental-health',
    'nutrition',
    'exercise',
    'parenting',
    'medical',
    'support',
    'first-trimester',
    'second-trimester',
    'third-trimester',
    'postpartum',
    'breastfeeding',
    'menopause',
    'hormones',
  ];

  postForm: FormGroup = this.fb.group({
    title: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(200)],
    ],
    content: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(this.maxContentLength),
      ],
    ],
    categoryId: ['', Validators.required],
  });

  ngOnInit() {
    this.loadCategories();

    // Watch content changes for character count
    this.postForm.get('content')?.valueChanges.subscribe((value: string) => {
      this.characterCount = value.length;
    });
  }

  loadCategories() {
    this.isLoading = true;
    this.forumService.getCategories().subscribe({
      next: (response: any) => {
        if (response && response.success) {
          const categories = response.data.map((category: any) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon || 'chatbubbles-outline',
            color: category.color || '#3880ff',
          }));
          this.categories.set(categories);

          // Set default category if available
          if (
            categories.length > 0 &&
            !this.postForm.get('categoryId')?.value
          ) {
            this.postForm.patchValue({ categoryId: categories[0].id });
          }
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.errorMessage = 'Failed to load categories';
        this.isLoading = false;

        // Fallback to mock categories
        this.loadMockCategories();
      },
    });
  }

  private loadMockCategories() {
    const mockCategories: ForumCategory[] = [
      {
        id: '1',
        name: 'General Discussion',
        description: 'General topics and discussions',
        icon: 'chatbubbles-outline',
        color: '#3880ff',
      },
      {
        id: '2',
        name: 'Pregnancy & Fertility',
        description: 'Pregnancy, fertility, and conception topics',
        icon: 'heart-outline',
        color: '#eb445a',
      },
      {
        id: '3',
        name: 'Mental Health',
        description: 'Mental health and emotional well-being',
        icon: 'happy-outline',
        color: '#2dd36f',
      },
      {
        id: '4',
        name: 'Health & Wellness',
        description: 'General health and wellness topics',
        icon: 'fitness-outline',
        color: '#ffc409',
      },
    ];
    this.categories.set(mockCategories);
    this.postForm.patchValue({ categoryId: mockCategories[0].id });
  }

  addTag() {
    const tag = this.currentTag.trim().toLowerCase();
    if (tag && !this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
      this.currentTag = '';
    }
  }

  removeTag(tag: string) {
    this.selectedTags = this.selectedTags.filter((t) => t !== tag);
  }

  addPopularTag(tag: string) {
    if (!this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
    }
  }

  onTagInputKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  async submitPost() {
    if (this.postForm.invalid) {
      await this.showFormErrors();
      return;
    }

    if (this.selectedTags.length === 0) {
      const result = await this.showTagConfirmation();
      if (!result) return;
    }

    this.isSubmitting = true;
    const formValue = this.postForm.value;

    // Create the post data
    const postData = {
      title: formValue.title.trim(),
      content: formValue.content.trim(),
      categoryId: formValue.categoryId,
      tags: this.selectedTags,
    };

    this.forumThreadsService
      .createForumPost(postData as any)
      .pipe(
        catchError((error: any) => {
          console.error('Error creating post:', error);
          this.showToast(
            'Failed to create post: ' +
              (error.error?.message || error.message || 'Network error'),
            'danger'
          );
          return of(null);
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe((response: any) => {
        if (response && response.success) {
          this.showToast('Post created successfully!', 'success');
          // Navigate back to forums or to the new post
          setTimeout(() => {
            this.navCtrl.back();
          }, 1500);
        } else {
          this.showToast(
            'Failed to create post: ' + (response?.message || 'Unknown error'),
            'danger'
          );
        }
      });
  }

  private async showFormErrors() {
    const errors = [];

    if (this.postForm.get('title')?.errors?.['required']) {
      errors.push('Title is required');
    } else if (this.postForm.get('title')?.errors?.['minlength']) {
      errors.push('Title must be at least 5 characters long');
    } else if (this.postForm.get('title')?.errors?.['maxlength']) {
      errors.push('Title must be less than 200 characters');
    }

    if (this.postForm.get('content')?.errors?.['required']) {
      errors.push('Content is required');
    } else if (this.postForm.get('content')?.errors?.['minlength']) {
      errors.push('Content must be at least 10 characters long');
    } else if (this.postForm.get('content')?.errors?.['maxlength']) {
      errors.push(
        `Content must be less than ${this.maxContentLength} characters`
      );
    }

    if (this.postForm.get('categoryId')?.errors?.['required']) {
      errors.push('Please select a category');
    }

    if (errors.length > 0) {
      const alert = await this.alertController.create({
        header: 'Please fix the following issues',
        message: errors.join('<br>'),
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  private async showTagConfirmation(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'No Tags Added',
        message:
          'Adding tags helps others find your post. Are you sure you want to continue without tags?',
        buttons: [
          {
            text: 'Add Tags',
            role: 'cancel',
            handler: () => resolve(false),
          },
          {
            text: 'Continue Anyway',
            handler: () => resolve(true),
          },
        ],
      });
      await alert.present();
    });
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  getContentPercentage(): number {
    return (this.characterCount / this.maxContentLength) * 100;
  }

  getContentColor(): string {
    const percentage = this.getContentPercentage();
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'success';
  }

  goBack() {
    this.navCtrl.back();
  }

  clearForm() {
    this.postForm.reset();
    this.selectedTags = [];
    this.characterCount = 0;
  }

  async showPreview() {
    const formValue = this.postForm.value;
    if (!formValue.title || !formValue.content) {
      await this.showToast(
        'Please add title and content to preview',
        'warning'
      );
      return;
    }

    const alert = await this.alertController.create({
      header: 'Post Preview',
      message: `
        <div style="text-align: left;">
          <h3 style="margin: 0 0 10px 0; color: #3880ff;">${
            formValue.title
          }</h3>
          <p style="margin: 0; color: #666; white-space: pre-wrap;">${
            formValue.content
          }</p>
          ${
            this.selectedTags.length > 0
              ? `
            <div style="margin-top: 10px;">
              <strong>Tags:</strong> ${this.selectedTags.join(', ')}
            </div>
          `
              : ''
          }
        </div>
      `,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
