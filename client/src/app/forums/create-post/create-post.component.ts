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
import { TranslationService } from '../../shared/services/translation.service';
import { ForumCategoryMapperService } from '../../shared/services/forum-category-mapper.service';
import { LogoLoadingComponent } from '../../shared/components/logo-loading/logo-loading.component';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { LocalizedNumberPipe } from '../../shared/pipes/localized-number.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  slug?: string;
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
    AppButtonComponent,
    LocalizedNumberPipe,
    TranslatePipe,
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
  private readonly translation = inject(TranslationService);
  private readonly categoryMapper = inject(ForumCategoryMapperService);

  // Component state
  categories = signal<ForumCategory[]>([]);
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  currentTag = '';
  selectedTags: string[] = [];
  characterCount = 0;
  maxContentLength = 5000;
  isPreviewOpen = false;

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
      const forumId = params['category'];
      if (forumId) {
        this.postForm.patchValue({ forumId });
        const category = this.categories().find((c) => c.id === forumId);
        if (category) {
          this.selectedCategory = category;
        }
      }
    });
  }

  loadCategories() {
    this.isLoading = true;
    this.forumService.getCategories().subscribe({
      next: (response: any) => {
        if (response.success === true) {
          this.categories.set(response.data);
          const forumId = this.postForm.get('forumId')?.value;
          if (forumId) {
            const category = response.data.find((c: ForumCategory) => c.id === forumId);
            if (category) {
              this.selectedCategory = category;
            }
          }
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.errorMessage = this.t('forums.createPost.error.loadCategories');
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
    this.selectedForum = null;
    this.selectedCategory = category;
  }

  selectCategory(category: ForumCategory): void {
    this.postForm.patchValue({ forumId: category.id });
    this.postForm.get('forumId')?.markAsTouched();
    this.selectedCategory = category;
    this.selectedForum = null;
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
      this.showToast(this.t('forums.createPost.error.loginRequired'), 'danger');
      this.isSubmitting = false;
      return;
    }
    const id = JSON.parse(userInfo).user.id;
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
            this.tParams('forums.createPost.error.createFailed', {
              error:
                error.error?.message ||
                error.message ||
                this.t('forums.topic.error.network'),
            }),
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
          this.showToast(this.t('forums.createPost.success.created'), 'success');
          // Navigate back to forums with the selected category
          this.router.navigate(['/forums']),
            this.forumService.emitPostCreated();
          this.clearForm();
        } else {
          this.showToast(
            this.tParams('forums.createPost.error.createFailed', {
              error: response?.message || this.t('forums.topic.error.unknown'),
            }),
            'danger'
          );
        }
      });
  }

  private async showFormErrors() {
    const errors = [];

    if (this.postForm.get('title')?.errors?.['required']) {
      errors.push(this.t('forums.createPost.titleRequired'));
    } else if (this.postForm.get('title')?.errors?.['minlength']) {
      errors.push(this.t('forums.createPost.error.titleRequiredLong'));
    } else if (this.postForm.get('title')?.errors?.['maxlength']) {
      errors.push(this.t('forums.createPost.titleMaxLength'));
    }

    if (this.postForm.get('content')?.errors?.['required']) {
      errors.push(this.t('forums.createPost.contentRequired'));
    } else if (this.postForm.get('content')?.errors?.['minlength']) {
      errors.push(this.t('forums.createPost.error.contentRequiredLong'));
    } else if (this.postForm.get('content')?.errors?.['maxlength']) {
      errors.push(
        this.tParams('forums.createPost.error.contentMaxLength', {
          max: this.maxContentLength,
        })
      );
    }

    if (this.postForm.get('forumId')?.errors?.['required']) {
      errors.push(this.t('forums.createPost.forumRequired'));
    }

    if (errors.length > 0) {
      const alert = await this.alertController.create({
        header: this.t('forums.createPost.error.fixIssuesHeader'),
        message: errors.join('<br>'),
        buttons: [this.t('common.ok')],
      });
      await alert.present();
    }
  }

  private async showTagConfirmation(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: this.t('forums.createPost.alert.noTagsHeader'),
        message: this.t('forums.createPost.alert.noTagsMessage'),
        buttons: [
          {
            text: this.t('forums.createPost.alert.addTags'),
            role: 'cancel',
            handler: () => resolve(false),
          },
          {
            text: this.t('forums.createPost.alert.continueAnyway'),
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
    const selectedForumId = this.postForm.get('forumId')?.value;
    if (selectedForumId) {
      this.navCtrl.back();
    } else {
      // Fallback to regular back navigation
      this.navCtrl.back();
    }
  }

  clearForm() {
    this.postForm.reset();
    this.selectedTags = [];
    this.characterCount = 0;
    this.selectedCategory = null;
  }

  async showPreview() {
    const formValue = this.postForm.value;
    if (!formValue.title || !formValue.content) {
      await this.showToast(this.t('forums.createPost.toast.previewRequired'), 'warning');
      return;
    }
    this.isPreviewOpen = true;
  }

  closePreview() {
    this.isPreviewOpen = false;
  }

  getSelectedForumName(): string {
    const selectedForumId = this.postForm.get('forumId')?.value;
    if (!selectedForumId) {
      return this.t('forums.createPost.noForumSelected');
    }

    const selected = this.categories().find((category) => category.id === selectedForumId);
    return selected
      ? this.categoryMapper.translateName(selected)
      : this.categoryMapper.translateName(selectedForumId);
  }

  categoryName(category: ForumCategory): string {
    return this.categoryMapper.translateName(category);
  }

  getCategoryIcon(category: ForumCategory): string {
    return this.categoryMapper.getIcon(category);
  }

  tagsCountLabel(): string {
    return this.tParams('forums.createPost.tagsCount', {
      count: this.selectedTags.length,
    });
  }

  previewTagsCountLabel(): string {
    return this.tParams('forums.createPost.previewTagsCount', {
      count: this.selectedTags.length,
    });
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private tParams(
    key: string,
    params: Record<string, string | number>,
  ): string {
    return this.translation.translateParams(key, params);
  }

  // Modern tag functionality
  showSuggestions = false;
  filteredSuggestions: string[] = [];
  selectedSuggestionIndex = -1;
  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  canAddMoreTags(): boolean {
    return this.selectedTags.length < 10;
  }

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
    if (!this.isTagSelected(tag) && this.canAddMoreTags()) {
      this.selectedTags.push(tag);
    }
  }

  togglePopularTag(tag: string) {
    if (this.isTagSelected(tag)) {
      this.removeTag(tag);
      return;
    }

    if (this.canAddMoreTags()) {
      this.selectedTags.push(tag);
    }
  }

  // Enhanced tag removal
  removeTag(tag: string) {
    this.selectedTags = this.selectedTags.filter((t) => t !== tag);
  }
}
