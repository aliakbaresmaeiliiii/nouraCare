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
  NavController,
  ToastController,
} from '@ionic/angular';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ForumService } from '../../shared/services/forum.service';
import { TranslationService } from '../../shared/services/translation.service';
import { ForumCategoryMapperService } from '../../shared/services/forum-category-mapper.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { LocalizedNumberPipe } from '../../shared/pipes/localized-number.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { containsProfanityInFields } from '../../shared/utils/profanity-filter.util';

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
    AppButtonComponent,
    LocalizedNumberPipe,
    TranslatePipe,
  ],
})
export class CreatePostComponent implements OnInit {
  private navCtrl = inject(NavController);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private forumService = inject(ForumService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private fb = inject(FormBuilder);
  private readonly translation = inject(TranslationService);
  private readonly categoryMapper = inject(ForumCategoryMapperService);

  categories = signal<ForumCategory[]>([]);
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  currentTag = '';
  selectedTags: string[] = [];
  characterCount = 0;
  maxContentLength = 5000;
  selectedCategory: ForumCategory | null = null;

  readonly quickTags = [
    'pregnancy',
    'period',
    'fertility',
    'symptoms',
    'nutrition',
    'support',
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
    forumId: ['', Validators.required],
  });

  ngOnInit() {
    this.hydrateCategoriesFromCache();
    this.handleQueryParams();
    this.loadCategories();

    this.postForm.get('content')?.valueChanges.subscribe((value: string) => {
      this.characterCount = (value ?? '').length;
    });
  }

  private handleQueryParams() {
    this.route.queryParams.subscribe((params) => {
      const forumId = params['category'];
      if (forumId) {
        this.postForm.patchValue({ forumId });
        this.syncSelectedCategory(forumId);
      }
    });
  }

  private hydrateCategoriesFromCache(): void {
    const cached = this.forumService.getStoreDataCategory();
    if (cached.length > 0) {
      this.applyCategories(cached);
    }
  }

  private applyCategories(data: ForumCategory[]): void {
    this.categories.set(data);
    this.syncSelectedCategory(this.postForm.get('forumId')?.value);
  }

  private syncSelectedCategory(forumId: string | null | undefined): void {
    if (!forumId) {
      return;
    }
    const category = this.categories().find((c) => c.id === forumId);
    if (category) {
      this.selectedCategory = category;
    }
  }

  loadCategories() {
    const hadCachedCategories = this.categories().length > 0;
    if (!hadCachedCategories) {
      this.isLoading = true;
    }

    this.forumService
      .getCategories()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response: any) => {
          if (response.success === true) {
            this.forumService.setStoreDataCategory(response.data);
            this.applyCategories(response.data);
          }
        },
        error: (error: any) => {
          console.error('Error loading categories:', error);
          if (!hadCachedCategories) {
            this.errorMessage = this.t('forums.createPost.error.loadCategories');
          }
        },
      });
  }

  onForumSelect(event: CustomEvent<{ value: string }>) {
    const selectedId = event.detail.value;
    const category = this.categories().find((c) => c.id === selectedId) ?? null;
    this.selectedCategory = category;
    this.postForm.get('forumId')?.markAsTouched();
  }

  submitPost() {
    this.postForm.markAllAsTouched();

    if (this.postForm.invalid) {
      void this.showFormErrors();
      return;
    }

    if (!this.selectedCategory) {
      this.syncSelectedCategory(this.postForm.get('forumId')?.value);
    }

    if (!this.selectedCategory) {
      void this.showToast(this.t('forums.createPost.forumRequired'), 'warning');
      return;
    }

    const formValue = this.postForm.value;
    if (
      containsProfanityInFields(
        formValue.title,
        formValue.content,
        ...this.selectedTags,
      )
    ) {
      void this.showToast(this.t('forums.error.profanity'), 'warning');
      return;
    }

    this.isSubmitting = true;
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      void this.showToast(this.t('forums.createPost.error.loginRequired'), 'danger');
      this.isSubmitting = false;
      return;
    }

    const threadData = {
      title: formValue.title.trim(),
      description: formValue.content.trim(),
      categoryId: this.selectedCategory.id,
      tags: this.selectedTags,
    };

    this.forumService
      .createForumThread(threadData as any)
      .pipe(
        catchError((error: any) => {
          console.error('Error creating post:', error);
          void this.showToast(
            this.tParams('forums.createPost.error.createFailed', {
              error:
                error.error?.message ||
                error.message ||
                this.t('forums.topic.error.network'),
            }),
            'danger',
          );
          return of(null);
        }),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe((response: any) => {
        if (response && response.success) {
          void this.showToast(this.t('forums.createPost.success.created'), 'success');
          this.router.navigate(['/forums']);
          this.forumService.emitPostCreated();
        } else if (response) {
          void this.showToast(
            this.tParams('forums.createPost.error.createFailed', {
              error: response?.message || this.t('forums.topic.error.unknown'),
            }),
            'danger',
          );
        }
      });
  }

  private async showFormErrors() {
    const errors: string[] = [];

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
        }),
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

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  goBack() {
    this.navCtrl.back();
  }

  categoryName(category: ForumCategory): string {
    return this.categoryMapper.translateName(category);
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  canAddMoreTags(): boolean {
    return this.selectedTags.length < 10;
  }

  onTagEnter(event: Event) {
    event.preventDefault();
    this.addTag();
  }

  addTag() {
    const tag = this.currentTag.trim().toLowerCase();
    if (tag && !this.selectedTags.includes(tag) && this.canAddMoreTags()) {
      this.selectedTags.push(tag);
      this.currentTag = '';
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

  removeTag(tag: string) {
    this.selectedTags = this.selectedTags.filter((t) => t !== tag);
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
}
