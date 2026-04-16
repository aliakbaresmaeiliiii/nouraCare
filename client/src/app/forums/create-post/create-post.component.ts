import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
  NavController,
  ToastController,
  IonTextarea,
} from '@ionic/angular';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ForumService } from '../../shared/services/forum.service';
import { LogoLoadingComponent } from '../../shared/components/logo-loading/logo-loading.component';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  forums: Forum[];
}

interface Forum {
  id: string;
  name: string;
  description: string;
  categoryId: string;
}

interface CreatePostForm {
  title: string;
  content: string;
  forumId: string; // Changed from categoryId to forumId
  tags: string[];
}

@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LogoLoadingComponent,
  ],
})
export class CreatePostComponent implements OnInit {
  // Dependency injection
  private navCtrl = inject(NavController);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
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
    forumId: ['', Validators.required], // Changed from categoryId to forumId
  });

  ngOnInit() {
    this.loadCategories();
    this.handleQueryParams();

    // Watch content changes for character count
    this.postForm.get('content')?.valueChanges.subscribe((value: string) => {
      this.characterCount = value.length;
    });
  }

  private handleQueryParams() {
    this.route.queryParams.subscribe((params) => {
      const categoryId = params['category'];
      if (categoryId) {
        // Set the category ID in the form
        this.postForm.patchValue({ categoryId });
      }
    });
  }

  loadCategories() {
    this.isLoading = true;
    this.forumService.getCategories().subscribe({
      next: (response: any) => {
        if (response.success === true) {
          this.categories.set(response.data);
        }
        // if (response && response.success) {
        //   // Simple approach - just process the data as is
        //   const categories = response.data
        //     .filter(
        //       (category: any) =>
        //         category.forum_thread && category.forum_thread.length > 0
        //     )
        //     .map((category: any) => ({
        //       id: category.id,
        //       name: category.name,
        //       description: category.description,
        //       icon: category.icon || 'chatbubbles-outline',
        //       forum_thread: category.color || '#3880ff',
        //       forums: category.forum_thread.map((forum: any) => ({
        //         id: forum.id,
        //         name: forum.name,
        //         description: forum.description,
        //         categoryId: category.id,
        //       })),
        //     }));

        //   this.categories.set(categories);

        //   // Set default forum if available
        //   if (categories.length > 0 && !this.postForm.get('forumId')?.value) {
        //     const firstCategory = categories[0];
        //     if (firstCategory.forums && firstCategory.forums.length > 0) {
        //       this.postForm.patchValue({ forumId: firstCategory.forums[0].id });
        //     }
        //   }
        // }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.errorMessage = 'Failed to load categories';
        this.isLoading = false;
      },
    });
  }

  onTagInputKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }
  selectedCategory: any = null;
  selectedForum: any = null;

  onForumSelect(event: any) {
    const selectedId = event.detail.value;
    const category = this.categories().find((c) => c.id === selectedId);
    // Find the selected forum and its parent category
    this.selectedForum = null;
    this.selectedCategory = category;

    // this.categories().forEach((category) => {
    //   const foundForum = category.forums.find(
    //     (forum) => forum.categoryId === selectedForumId
    //   );
    //   if (foundForum) {
    //     this.selectedForum = foundForum;
    //     this.selectedCategory = category;
    //   }
    // });
  }

  submitPost() {
    if (this.postForm.invalid) {
      this.showFormErrors();
      return;
    }

    if (this.selectedTags.length === 0) {
      const result = this.showTagConfirmation();
      if (!result) return;
    }

    this.isSubmitting = true;
    const formValue = this.postForm.value;
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      this.showToast('You must be logged in to create a post', 'danger');
      this.isSubmitting = false;
      return;
    }
    const id = JSON.parse(userInfo).user.id;
    this.categories.apply(id);
    const threadData = {
      title: formValue.title.trim(),
      description: formValue.content.trim(),
      categoryId: this.selectedCategory.id, // Use the forumId from the form control
      tags: this.selectedTags,
      // tags are not part of the backend CreateForumThreadDto
      // You might need to handle tags separately or extend the backend
    };

    this.forumService
      .createForumThread(threadData as any)
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
          // Navigate back to forums with the selected category
          this.router.navigate(['/forums']),
            this.forumService.emitPostCreated();
          this.clearForm();
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

  private navigateBackToForumsWithCategory() {
    const selectedCategoryId = this.postForm.get('categoryId')?.value;
    if (selectedCategoryId) {
      // Navigate to forums with query parameters to select the category
      // this.router.navigate(['/forums'], {
      //   queryParams: { category: selectedCategoryId, view: 'topics' },
      //   replaceUrl: true
      // });
    } else {
      // Fallback to regular back navigation
      this.navCtrl.back();
    }
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

  // Modern tag functionality
  showSuggestions = false;
  filteredSuggestions: string[] = [];
  selectedSuggestionIndex = -1;
  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  // Tag color variations for visual appeal
  getTagColor(index: number): string {
    const colors = ['tag-primary', 'tag-secondary', 'tag-success', 'tag-warning', 'tag-danger'];
    return colors[index % colors.length];
  }

  // Handle tag input changes for autocomplete
  onTagInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.toLowerCase().trim();
    
    if (value.length > 0) {
      this.filteredSuggestions = this.popularTags.filter(tag => 
        tag.toLowerCase().includes(value) && !this.selectedTags.includes(tag)
      );
      this.selectedSuggestionIndex = -1;
    } else {
      this.filteredSuggestions = [];
    }
  }

  // Handle keyboard navigation in autocomplete
  onTagInputKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (this.selectedSuggestionIndex >= 0 && this.filteredSuggestions.length > 0) {
          this.selectSuggestion(this.filteredSuggestions[this.selectedSuggestionIndex]);
        } else {
          this.addTag();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (this.filteredSuggestions.length > 0) {
          this.selectedSuggestionIndex = Math.min(
            this.selectedSuggestionIndex + 1,
            this.filteredSuggestions.length - 1
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        break;
      case 'Escape':
        this.showSuggestions = false;
        this.selectedSuggestionIndex = -1;
        break;
    }
  }

  // Handle tag input blur with delay to allow clicking suggestions
  onTagInputBlur() {
    setTimeout(() => {
      this.showSuggestions = false;
      this.selectedSuggestionIndex = -1;
    }, 200);
  }

  // Select a suggestion from autocomplete
  selectSuggestion(suggestion: string) {
    if (!this.selectedTags.includes(suggestion) && this.selectedTags.length < 10) {
      this.selectedTags.push(suggestion);
      this.currentTag = '';
      this.showSuggestions = false;
      this.filteredSuggestions = [];
      this.selectedSuggestionIndex = -1;
    }
  }

  // Enhanced add tag with validation
  addTag() {
    const tag = this.currentTag.trim().toLowerCase();
    if (tag && !this.selectedTags.includes(tag) && this.selectedTags.length < 10) {
      this.selectedTags.push(tag);
      this.currentTag = '';
      this.showSuggestions = false;
      this.filteredSuggestions = [];
    }
  }

  // Enhanced popular tag addition
  addPopularTag(tag: string) {
    if (!this.selectedTags.includes(tag) && this.selectedTags.length < 10) {
      this.selectedTags.push(tag);
    }
  }

  // Enhanced tag removal
  removeTag(tag: string) {
    this.selectedTags = this.selectedTags.filter((t) => t !== tag);
  }
}
