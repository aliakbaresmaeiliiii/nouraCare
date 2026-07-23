import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  NavController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';

import { Share } from '@capacitor/share';
import { addIcons } from 'ionicons';
import {
  alertCircle,
  arrowBack,
  arrowUndoOutline,
  chatbubblesOutline,
  createOutline,
  eyeOutline,
  ellipsisHorizontal,
  heart,
  heartOutline,
  pin,
  refreshOutline,
  send,
  shareOutline,
  trashOutline,
} from 'ionicons/icons';
import { of, Subscription } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  skip,
  tap,
} from 'rxjs/operators';
import {
  Comment,
  CreateCommentDto,
  CreateForumThreadDto,
  ForumCategory,
  ForumTopic,
} from '@app/shared/models/forum';
import { ForumService } from '@app/shared/services/forum.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { ForumCategoryMapperService } from '@app/shared/services/forum-category-mapper.service';
import { containsProfanityInFields } from '@app/shared/utils/profanity-filter.util';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';

const MAX_COMMENT_LENGTH = 5000;

@Component({
  selector: 'app-topic-detail',
  templateUrl: './topic-detail.component.html',
  styleUrls: ['./topic-detail.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class TopicDetailComponent implements OnInit, OnDestroy, ViewWillEnter {
  // Dependency injection
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private forumService = inject(ForumService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private readonly translation = inject(TranslationService);
  private readonly categoryMapper = inject(ForumCategoryMapperService);

  // Component state
  topic: ForumTopic | null = null;
  categories = signal<ForumCategory[]>([]);
  comments = signal<Comment[]>([]);
  newComment = '';
  isLoading = signal(false);
  isSubmittingComment = false;
  isSubmittingReply = false;
  isEditingComment: string | null = null;
  editTexts: { [commentId: string]: string } = {};
  errorMessage = '';
  showReplyInput: string | null = null;
  replyTexts: { [commentId: string]: string } = {};
  isEditingPost = false;
  isSavingPost = false;
  editPostTitle = '';
  editPostContent = '';
  topicId = signal<string | null>(null);
  storeData = signal<any | null>(null);
  router = inject(Router);
  userId = signal<number | null>(null);
  categoryId = signal<string | undefined>('');
  private paramSub?: Subscription;
  private lastViewSyncAt = 0;
  pinnedCommentId = signal<string | null>(null);
  // Computed properties for better performance
  get canEditOrDeletePost(): boolean {
    if (!this.topic) return false;
    // In a real app, this would check against actual user data
    return false;
  }

  get commentsCount(): number {
    return this.comments.length;
  }

  get isEditing(): boolean {
    return this.isEditingComment !== null || this.isEditingPost;
  }

  constructor() {
    addIcons({
      shareOutline,
      refreshOutline,
      alertCircle,
      arrowBack,
      pin,
      chatbubblesOutline,
      eyeOutline,
      ellipsisHorizontal,
      createOutline,
      trashOutline,
      heart,
      heartOutline,
      arrowUndoOutline,
      send,
    });
  }

  private mapRecentCommentsToDetailComments(
    comments: Array<{
      id: string;
      comment: string;
      createdAt: string;
      authorId?: number;
      likeCount?: number;
      isLiked?: boolean;
      parentId?: string | null;
      updatedAt?: string;
    }> = []
  ): Comment[] {
    return comments.map((item) => {
      const authorId = Number(item.authorId) || 0;
      return {
        id: item.id,
        content: item.comment || '',
        author: {
          id: authorId,
          name: this.t('forums.topic.communityMember'),
          profileImage: null,
        },
        authorId,
        threadId: this.topicId() || '',
        parentId: item.parentId ?? null,
        isDeleted: false,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
        replies: [],
        isLiked: !!item.isLiked,
        _count: {
          likes: Number(item.likeCount) || 0,
          replies: 0,
        },
      };
    });
  }

  private mapApiCommentToDetailComment(row: any): Comment {
    const authorId = Number(row.authorId ?? row.author?.id) || 0;
    const text = row.content ?? row.comment ?? '';
    const created =
      typeof row.createdAt === 'string'
        ? row.createdAt
        : row.createdAt?.toISOString?.() || new Date().toISOString();
    const updated =
      typeof row.updatedAt === 'string'
        ? row.updatedAt
        : row.updatedAt?.toISOString?.() || created;
    return {
      id: row.id,
      content: text,
      author: row.author?.name
        ? {
            id: Number(row.author?.id) || authorId,
            name: row.author.name,
            profileImage: row.author.profileImage ?? null,
          }
        : {
            id: authorId,
            name: this.t('forums.topic.communityMember'),
            profileImage: null,
          },
      authorId,
      threadId: row.threadId || this.topicId() || '',
      parentId: row.parentId ?? null,
      isDeleted: !!row.isDeleted,
      createdAt: created,
      updatedAt: updated,
      replies: [],
      isLiked: row.isLiked ?? false,
      _count: row._count ?? { likes: Number(row.likeCount) || 0, replies: 0 },
    };
  }

  private normalizeTopic(topic: any): ForumTopic {
    const rawViews = topic?.views ?? topic?.viewCount ?? topic?.view_count ?? 0;
    const normalizedViews = Number(rawViews);
    return {
      id: topic.id,
      title: topic.title || this.t('forums.untitled'),
      comment: topic.comment || topic.content || '',
      author: topic.author || topic.user?.fullName || this.t('forums.anonymous'),
      authorAvatar:
        topic.authorAvatar ||
        topic.user?.profileImage ||
        topic.user?.user_profile?.avatarUrl ||
        '/assets/images/nurse.png',
      category: topic.category || this.t('forums.generalDiscussion'),
      categoryId: topic.categoryId,
      replies: topic.replies ?? topic.commentCount ?? 0,
      viewCount: Number.isFinite(normalizedViews) ? normalizedViews : 0,
      lastReply: topic.lastReply || topic.updatedAt || topic.createdAt,
      isPinned: !!topic.isPinned,
      isLocked: !!topic.isLocked,
      likeCount: topic.likeCount || 0,
      forumPosts: topic.forumPosts || [],
      tags: topic.tags || [],
      user: topic.user || {
        id: 0,
        fullName: topic.author || this.t('forums.anonymous'),
        profileImage: '',
      },
      createdAt: topic.createdAt || new Date().toISOString(),
      forumId: topic.forumId || '',
      recentComments: topic.recentComments || topic.comments || [],
    };
  }

  private mergeThreadDetailResponse(response: any): void {
    if (!response?.success) return;
    const apiTopic = this.normalizeTopic(response.data || response);
    const prev = this.topic;
    this.topic = {
      ...apiTopic,
      recentComments:
        apiTopic.recentComments?.length
          ? apiTopic.recentComments
          : prev?.recentComments || [],
    };
    if (this.topic.recentComments?.length) {
      this.comments.set(
        this.mapRecentCommentsToDetailComments(this.topic.recentComments)
      );
    }
  }

  /** GET thread increments viewCount on the server; merge result into UI state. */
  private syncThreadWithServer(threadId: string): void {
    this.forumService.fetchThreadById(threadId, this.userId()).subscribe({
      next: (response: any) => this.mergeThreadDetailResponse(response),
    });
  }

  private syncThreadWithServerSafely(threadId: string): void {
    const now = Date.now();
    // Avoid duplicate GETs fired by ngOnInit + ionViewWillEnter back-to-back.
    if (now - this.lastViewSyncAt < 700) return;
    this.lastViewSyncAt = now;
    this.syncThreadWithServer(threadId);
  }

  private hydrateTopicFromStore(threadId: string): void {
    const selected = this.forumService.getTopicDetail();
    const storeThreads = this.forumService.getStoreDataThread();
    const fromStore = storeThreads.find((thread) => thread.id === threadId);
    const source = selected?.id === threadId ? selected : fromStore;
    if (source) {
      this.topic = this.normalizeTopic(source);
      this.comments.set(
        this.mapRecentCommentsToDetailComments(this.topic.recentComments)
      );
    }
  }

  private readStoredUserId(): number | null {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;
    try {
      const u = JSON.parse(raw);
      const id = u?.id ?? u?.user?.id ?? u?.data?.user?.id;
      if (id == null || id === '') return null;
      const n = Number(id);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }

  ngOnInit() {
    const sid = this.readStoredUserId();
    if (sid != null) this.userId.set(sid);

    const threadId = this.route.snapshot.paramMap.get('id');
    this.topicId.set(threadId);
    if (!threadId) {
      this.errorMessage = this.t('forums.topic.notFound');
      return;
    }

    this.hydrateTopicFromStore(threadId);
    // Ensure first open always hits API (increments viewCount server-side).
    this.syncThreadWithServerSafely(threadId);

    // Same component instance, different :id — refetch without double-counting first load
    // (first load is handled in ionViewWillEnter).
    this.paramSub = this.route.paramMap
      .pipe(
        map((p) => p.get('id')),
        filter((id): id is string => !!id),
        distinctUntilChanged(),
        skip(1),
      )
      .subscribe((id) => {
        this.topicId.set(id);
        this.hydrateTopicFromStore(id);
        this.syncThreadWithServerSafely(id);
      });
  }

  ionViewWillEnter(): void {
    const sid = this.readStoredUserId();
    if (sid != null) this.userId.set(sid);
    const threadId = this.route.snapshot.paramMap.get('id');
    if (!threadId) return;
    this.topicId.set(threadId);
    this.syncThreadWithServerSafely(threadId);
  }

  submitComment() {
    const text = this.newComment.trim();
    if (!text) {
      this.showToast(this.t('forums.topic.toast.writeComment'), 'warning');
      return;
    }
    if (text.length > MAX_COMMENT_LENGTH) {
      this.showToast(
        this.tParams('forums.createPost.error.contentMaxLength', {
          max: MAX_COMMENT_LENGTH,
        }),
        'warning',
      );
      return;
    }
    if (this.blockIfProfanity(text)) {
      return;
    }

    if (!this.topic) {
      this.showToast(this.t('forums.topic.notFound'), 'danger');
      return;
    }

    this.isSubmittingComment = true;
    const topicId = this.topicId();

    const createComment: CreateCommentDto = {
      content: text,
      postId: topicId!,
      parentId: this.categoryId(),
    };

    // Get user info for optimistic update
    const userInfo = localStorage.getItem('userInfo');
    const currentUser = userInfo ? JSON.parse(userInfo) : null;

    // Create optimistic comment
    const optimisticComment: Comment = {
      id: 'temp-' + Date.now(), // Temporary ID
      content: this.newComment.trim(),
      author: {
        id: currentUser?.id || 0,
        name: currentUser?.name || this.t('forums.topic.you'),
        profileImage: currentUser?.profileImage || null,
      },
      authorId: currentUser?.id || 0,
      threadId: topicId!,
      parentId: null,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
      isLiked: false,
      _count: {
        likes: 0,
        replies: 0,
      },
    };

    // Optimistic update - add comment immediately to UI
    this.comments.update((comments) => [optimisticComment, ...comments]);
    this.newComment = '';

    this.forumService
      .createComment(createComment)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            const mapped = this.mapApiCommentToDetailComment(response.data);
            mapped.author = {
              id: currentUser?.id ?? mapped.authorId,
              name: currentUser?.name || currentUser?.fullName || this.t('forums.topic.you'),
              profileImage:
                currentUser?.profileImage ?? mapped.author.profileImage,
            };
            mapped.authorId = currentUser?.id ?? mapped.authorId;
            this.comments.update((comments) =>
              comments.map((comment) =>
                comment.id === optimisticComment.id ? mapped : comment
              )
            );
            this.showToast(this.t('forums.topic.toast.commentPosted'), 'success');
            this.forumService.emitPostCreated();
          } else {
            // Remove optimistic comment on failure
            this.comments.update((comments) =>
              comments.filter((comment) => comment.id !== optimisticComment.id)
            );
            this.showToast(
              this.tParams('forums.topic.toast.commentPostFailed', {
                error: response?.message || this.t('forums.topic.error.unknown'),
              }),
              'danger'
            );
          }
        }),
        catchError((error: any) => {
          // Remove optimistic comment on error
          this.comments.update((comments) =>
            comments.filter((comment) => comment.id !== optimisticComment.id)
          );
          this.showToast(
            this.tParams('forums.topic.toast.commentPostFailed', {
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
          this.isSubmittingComment = false;
        })
      )
      .subscribe();
  }

  likeComment(commentId: string) {
    const snapshot = this.comments();
    let targetComment: Comment | undefined = snapshot.find((c) => c.id === commentId);
    if (!targetComment) {
      for (const parentComment of snapshot) {
        const reply = parentComment.replies?.find((r) => r.id === commentId);
        if (reply) {
          targetComment = reply;
          break;
        }
      }
    }
    if (!targetComment) return;

    const previousLiked = !!targetComment.isLiked;
    const previousLikes = Number(targetComment._count?.likes || 0);
    const isLike = !previousLiked;

    const applyLikeState = (liked: boolean, likeCount: number) => {
      this.comments.update((list) =>
        list.map((item) => {
          if (item.id === commentId) {
            return {
              ...item,
              isLiked: liked,
              _count: { ...item._count, likes: Math.max(0, likeCount) },
            };
          }
          if (item.replies?.length) {
            const nextReplies = item.replies.map((reply) =>
              reply.id === commentId
                ? {
                    ...reply,
                    isLiked: liked,
                    _count: { ...reply._count, likes: Math.max(0, likeCount) },
                  }
                : reply
            );
            return { ...item, replies: nextReplies };
          }
          return item;
        })
      );
    };

    // Optimistic update
    applyLikeState(isLike, previousLikes + (isLike ? 1 : -1));

    this.forumService
      .likeComment(commentId, isLike)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            const serverLikeCount = Number(response?.data?.likeCount);
            applyLikeState(
              isLike,
              Number.isFinite(serverLikeCount)
                ? serverLikeCount
                : previousLikes + (isLike ? 1 : -1)
            );
            this.showToast(
              isLike
                ? this.t('forums.topic.toast.liked')
                : this.t('forums.topic.toast.disliked'),
              'success'
            );
          } else {
            applyLikeState(previousLiked, previousLikes);
            this.showToast(this.t('forums.topic.toast.likeFailed'), 'danger');
          }
        }),
        catchError((error: any) => {
          applyLikeState(previousLiked, previousLikes);
          this.showToast(this.t('forums.topic.toast.likeFailed'), 'danger');
          return of(null);
        })
      )
      .subscribe();
  }

  // Reply functionality
  toggleReplyInput(commentId: string) {
    if (this.showReplyInput === commentId) {
      this.showReplyInput = null;
      this.replyTexts[commentId] = '';
    } else {
      this.showReplyInput = commentId;
      this.replyTexts[commentId] = '';
    }
  }

  cancelReply() {
    this.showReplyInput = null;
    // Clear all reply texts
    Object.keys(this.replyTexts).forEach((key) => {
      this.replyTexts[key] = '';
    });
  }

  submitReply(commentId: string) {
    const replyText = this.replyTexts[commentId]?.trim();
    const forumId = this.topic?.id || '';
    const id = this.topicId();
    if (!replyText) {
      this.showToast(this.t('forums.topic.toast.writeReply'), 'warning');
      return;
    }
    if (replyText.length > MAX_COMMENT_LENGTH) {
      this.showToast(
        this.tParams('forums.createPost.error.contentMaxLength', {
          max: MAX_COMMENT_LENGTH,
        }),
        'warning',
      );
      return;
    }
    if (this.blockIfProfanity(replyText)) {
      return;
    }

    if (!this.topic) {
      this.showToast(this.t('forums.topic.notFound'), 'danger');
      return;
    }

    this.isSubmittingReply = true;
    const payload = {
      content: replyText,
      id: id!,
      parentId: commentId,
      forumId: forumId,
    };

    this.forumService
      .createComment(payload)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            // Find the parent comment and add the reply
            const parentComment = this.comments().find(
              (c) => c.id === commentId
            );
            if (parentComment) {
              if (!parentComment.replies) {
                parentComment.replies = [];
              }
              const mapped = this.mapApiCommentToDetailComment(response.data);
              const userInfo = localStorage.getItem('userInfo');
              const currentUser = userInfo ? JSON.parse(userInfo) : null;
              mapped.author = {
                id: currentUser?.id ?? mapped.authorId,
                name: currentUser?.name || currentUser?.fullName || this.t('forums.topic.you'),
                profileImage:
                  currentUser?.profileImage ?? mapped.author.profileImage,
              };
              mapped.authorId = currentUser?.id ?? mapped.authorId;
              mapped.parentId = commentId;
              parentComment.replies.push(mapped);
              parentComment._count.replies += 1;
            }

            this.replyTexts[commentId] = '';
            this.showReplyInput = null;
            this.showToast(this.t('forums.topic.toast.replyPosted'), 'success');
            this.forumService.emitPostCreated();
          } else {
            this.showToast(
              this.tParams('forums.topic.toast.replyPostFailed', {
                error: response?.message || this.t('forums.topic.error.unknown'),
              }),
              'danger'
            );
          }
        }),
        catchError((error: any) => {
          this.showToast(
            this.tParams('forums.topic.toast.replyPostFailed', {
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
          this.isSubmittingReply = false;
        })
      )
      .subscribe();
  }

  // Method to create a new forum thread with the required DTO payload
  createForumThread(createForumThreadDto: CreateForumThreadDto) {
    this.isSubmittingReply = true;

    this.forumService
      .createForumThread(createForumThreadDto)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            this.showToast(this.t('forums.topic.toast.threadCreated'), 'success');
            // Optionally navigate to the new thread or refresh the list
          } else {
            this.showToast(
              this.tParams('forums.topic.toast.threadCreateFailed', {
                error: response?.message || this.t('forums.topic.error.unknown'),
              }),
              'danger'
            );
          }
        }),
        catchError((error: any) => {
          this.showToast(
            this.tParams('forums.topic.toast.threadCreateFailed', {
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
          this.isSubmittingReply = false;
        })
      )
      .subscribe();
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      // Create a fallback SVG avatar with user initials
      const authorName = target.alt || 'User';
      const initials = this.getInitials(authorName);
      const backgroundColor = this.stringToColor(authorName);

      const svgString = `
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="${backgroundColor}"/>
          <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${initials}</text>
        </svg>
      `;

      target.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    }
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  private stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      '#3880ff',
      '#5260ff',
      '#2dd36f',
      '#ffd700',
      '#c21e56',
      '#92949c',
      '#0cd1e8',
      '#7044ff',
      '#ff3d71',
      '#2fdf75',
    ];

    return colors[Math.abs(hash) % colors.length];
  }

  goBack() {
    this.navCtrl.back();
  }

  formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return diffDays === 1
          ? this.t('forums.time.yesterday')
          : this.tParams('forums.time.daysAgo', { days: diffDays });
      }
      if (diffHours > 0) {
        return diffHours === 1
          ? this.t('forums.time.oneHourAgo')
          : this.tParams('forums.time.hoursAgo', { hours: diffHours });
      }
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1
        ? this.t('forums.time.justNow')
        : this.tParams('forums.time.minutesAgo', { minutes: diffMinutes });
    } catch {
      return this.t('forums.time.recently');
    }
  }

  topicCategoryLabel(): string {
    if (!this.topic) return '';
    if (this.topic.categoryId) {
      const match = this.categories().find((c) => c.id === this.topic!.categoryId);
      if (match) {
        return this.categoryMapper.translateName(match);
      }
    }
    return this.categoryMapper.translateName(this.topic.category);
  }

  categoryName(category: ForumCategory): string {
    return this.categoryMapper.translateName(category);
  }

  commentsTitle(): string {
    return this.tParams('forums.topic.commentsTitle', {
      count: this.comments().length,
    });
  }

  commentsCountLabel(count: number): string {
    return this.tParams('forums.topic.commentsCount', { count });
  }

  viewsCountLabel(count: number): string {
    return this.tParams('forums.topic.viewsCount', { count });
  }

  formatLikeCount(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
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

  async shareTopic() {
    if (!this.topic) {
      await this.showToast(this.t('forums.topic.toast.shareUnavailable'), 'warning');
      return;
    }

    try {
      const shareData = {
        title: this.topic.title,
        text: `${this.topic.comment.substring(0, 200)}...`,
        url: `${window.location.origin}/forums/topic/${this.topic.id}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        await this.showToast(this.t('forums.topic.toast.shared'), 'success');
        return;
      }

      await Share.share(shareData);
      await this.showToast(this.t('forums.topic.toast.shared'), 'success');
    } catch (error) {
      console.error('Error sharing topic:', error);
      await this.showToast(this.t('forums.topic.toast.shareFailed'), 'danger');
    }
  }

  canEditOrDelete(comment: Comment): boolean {
    const uid = this.userId();
    if (uid == null) return false;
    return Number(uid) === Number(comment.authorId);
  }

  // Edit functionality
  startEditComment(comment: Comment) {
    if (!this.canEditOrDelete(comment)) {
      this.showToast(this.t('forums.topic.toast.editOwnOnly'), 'danger');
      return;
    }
    this.isEditingComment = comment.id;
    this.editTexts[comment.id] = comment.content;
  }

  cancelEdit() {
    this.isEditingComment = null;
    Object.keys(this.editTexts).forEach((key) => {
      this.editTexts[key] = '';
    });
  }

  async submitEdit(comment: Comment) {
    if (!this.canEditOrDelete(comment)) {
      await this.showToast(this.t('forums.topic.toast.editOwnOnly'), 'danger');
      this.cancelEdit();
      return;
    }

    const editText = this.editTexts[comment.id]?.trim();
    if (!editText) {
      await this.showToast(this.t('forums.topic.toast.writeToEdit'), 'warning');
      return;
    }

    if (editText === comment.content) {
      this.cancelEdit();
      return;
    }
    if (this.blockIfProfanity(editText)) {
      return;
    }

    // Optimistic update
    const originalContent = comment.content;
    comment.content = editText;
    comment.updatedAt = new Date().toISOString();

    this.forumService
      .editComment(comment.id, editText)
      .pipe(
        tap((response: any) => {
          if (response && response.success && response.data) {
            const row = response.data;
            comment.content = row.comment ?? row.content ?? comment.content;
            comment.updatedAt =
              typeof row.updatedAt === 'string'
                ? row.updatedAt
                : row.updatedAt?.toISOString?.() || comment.updatedAt;
            this.comments.update((arr) => [...arr]);
            this.showToast(this.t('forums.topic.toast.commentUpdated'), 'success');
          } else {
            // Revert optimistic update on failure
            comment.content = originalContent;
            this.showToast(
              this.tParams('forums.topic.toast.commentUpdateFailed', {
                error: response?.message || this.t('forums.topic.error.unknown'),
              }),
              'danger'
            );
          }
        }),
        catchError((error: any) => {
          // Revert optimistic update on error
          comment.content = originalContent;

          if (error.status === 403) {
            this.showToast(this.t('forums.topic.toast.noEditPermission'), 'danger');
          } else {
            this.showToast(
              this.tParams('forums.topic.toast.commentUpdateFailed', {
                error:
                  error.error?.message ||
                  error.message ||
                  this.t('forums.topic.error.network'),
              }),
              'danger'
            );
          }
          return of(null);
        }),
        finalize(() => {
          this.cancelEdit();
        })
      )
      .subscribe();
  }

  // Delete functionality
  async deleteComment(comment: Comment) {
    if (!this.canEditOrDelete(comment)) {
      await this.showToast(this.t('forums.topic.toast.deleteOwnOnly'), 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: this.t('forums.topic.alert.deleteCommentHeader'),
      message: this.t('forums.topic.alert.deleteCommentMessage'),
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: this.t('common.delete'),
          role: 'destructive',
          handler: () => {
            this.confirmDeleteComment(comment);
          },
        },
      ],
    });

    await alert.present();
  }

  async openPostActions(): Promise<void> {
    if (!this.topic) return;

    const dialog = await this.alertController.create({
      header: this.t('forums.topic.alert.postActionsHeader'),
      cssClass: 'liquid-glass-dialog',
      translucent: true,
      buttons: [
        {
          text: this.t('forums.topic.action.edit'),
          handler: () => this.startEditPost(),
        },
        {
          text: this.t('forums.topic.action.delete'),
          role: 'destructive',
          handler: () => this.deletePost(),
        },
      ],
    });

    await dialog.present();
  }

  async openCommentActions(comment: Comment): Promise<void> {
    if (!this.canEditOrDelete(comment)) return;
    const buttons: Array<{
      text: string;
      role?: 'cancel' | 'destructive';
      handler?: () => void;
    }> = [
      {
        text: this.t('forums.topic.action.edit'),
        handler: () => this.startEditComment(comment),
      },
    ];

    if (!comment.parentId) {
      const isPinned = this.pinnedCommentId() === comment.id;
      buttons.push({
        text: isPinned
          ? this.t('forums.topic.action.unpinComment')
          : this.t('forums.topic.action.pinComment'),
        handler: () => this.togglePinComment(comment.id),
      });
    }

    buttons.push(
      {
        text: this.t('forums.topic.action.delete'),
        role: 'destructive',
        handler: () => this.deleteComment(comment),
      },
    );

    const dialog = await this.alertController.create({
      header: this.t('forums.topic.alert.commentActionsHeader'),
      cssClass: 'liquid-glass-dialog',
      translucent: true,
      buttons,
    });

    await dialog.present();
  }

  togglePinComment(commentId: string): void {
    this.pinnedCommentId.update((current) =>
      current === commentId ? null : commentId,
    );
  }

  isPinnedComment(commentId: string): boolean {
    return this.pinnedCommentId() === commentId;
  }

  getOrderedComments(): Comment[] {
    const list = this.comments();
    const pinnedId = this.pinnedCommentId();
    if (!pinnedId) return list;
    const pinned = list.find((c) => c.id === pinnedId && !c.parentId);
    if (!pinned) return list;
    return [pinned, ...list.filter((c) => c.id !== pinnedId)];
  }

  private confirmDeleteComment(comment: Comment) {
    if (!this.canEditOrDelete(comment)) {
      this.showToast(this.t('forums.topic.toast.deleteOwnOnly'), 'danger');
      return;
    }

    // Store the original comment reference and position
    const originalComment = {
      ...comment,
      replies: comment.replies ? [...comment.replies] : [],
      _count: { ...comment._count },
    };
    const commentIndex = this.comments().findIndex((c) => c.id === comment.id);
    const isReply = !!comment.parentId;

    // Optimistic update - remove from UI immediately
    this.comments.update((list) => {
      if (!isReply) {
        return list.filter((c) => c.id !== comment.id);
      }
      return list.map((parentComment) => {
        const replyIndex = parentComment.replies?.findIndex(
          (r) => r.id === comment.id
        );
        if (replyIndex == null || replyIndex === -1) return parentComment;
        const nextReplies = [...parentComment.replies];
        nextReplies.splice(replyIndex, 1);
        return {
          ...parentComment,
          replies: nextReplies,
          _count: {
            ...parentComment._count,
            replies: Math.max(0, (parentComment._count?.replies || 0) - 1),
          },
        };
      });
    });

    this.forumService
      .deleteComment(comment.id)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            this.showToast(this.t('forums.topic.toast.commentDeleted'), 'success');
          } else {
            // Revert optimistic update on failure
            this.revertCommentDeletion(originalComment, commentIndex);
            this.showToast(
              this.tParams('forums.topic.toast.commentDeleteFailed', {
                error: response?.message || this.t('forums.topic.error.unknown'),
              }),
              'danger'
            );
          }
        }),
        catchError((error: any) => {
          // Revert optimistic update on error
          this.revertCommentDeletion(originalComment, commentIndex);

          if (error.status === 403) {
            this.showToast(this.t('forums.topic.toast.noDeletePermission'), 'danger');
          } else {
            this.showToast(
              this.tParams('forums.topic.toast.commentDeleteFailed', {
                error:
                  error.error?.message ||
                  error.message ||
                  this.t('forums.topic.error.network'),
              }),
              'danger'
            );
          }
          return of(null);
        })
      )
      .subscribe();
  }

  private revertCommentDeletion(comment: Comment, originalIndex: number) {
    this.comments.update((list) => {
      if (comment.parentId) {
        // It's a reply, add back to parent comment
        return list.map((parentComment) => {
          if (parentComment.id !== comment.parentId) return parentComment;
          const nextReplies = parentComment.replies
            ? [...parentComment.replies, comment]
            : [comment];
          return {
            ...parentComment,
            replies: nextReplies,
            _count: {
              ...parentComment._count,
              replies: (parentComment._count?.replies || 0) + 1,
            },
          };
        });
      }

      // It's a top-level comment, add back to comments array at original position
      const next = [...list];
      if (originalIndex >= 0 && originalIndex <= next.length) {
        next.splice(originalIndex, 0, comment);
      } else {
        next.push(comment);
      }
      return next;
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }

  // Manual refresh method
  refreshTopic(): void {
    const id = this.topicId();
    if (!id) return;
    this.forumService
      .fetchThreadById(id)
      .pipe(
        catchError((error: any) => {
          this.showToast(
            this.tParams('forums.topic.toast.refreshFailed', {
              error: error?.message || this.t('forums.topic.error.network'),
            }),
            'danger'
          );
          return of(null);
        })
      )
      .subscribe({
        next: (response: any) => this.mergeThreadDetailResponse(response),
      });
  }

  startEditPost() {
    if (!this.topic) return;
    this.isEditingPost = true;
    this.editPostTitle = this.topic.title;
    this.editPostContent = this.topic.comment;
  }

  cancelEditPost() {
    this.isEditingPost = false;
    this.editPostTitle = '';
    this.editPostContent = '';
  }

  async submitEditPost() {
    if (!this.topic || this.isSavingPost) return;
    const title = this.editPostTitle.trim();
    const content = this.editPostContent.trim();

    if (!title || !content) {
      await this.showToast(this.t('forums.topic.toast.titleContentRequired'), 'warning');
      return;
    }

    if (title === this.topic.title && content === this.topic.comment) {
      this.cancelEditPost();
      return;
    }
    if (this.blockIfProfanity(title, content)) {
      return;
    }

    // Optimistic update
    const originalTitle = this.topic.title;
    const originalDescription = this.topic.comment;
    const submittedTitle = title;
    const submittedContent = content;
    this.isSavingPost = true;
    this.isEditingPost = false;
    this.editPostTitle = '';
    this.editPostContent = '';
    this.topic.title = title;
    this.topic.comment = content;
    this.forumService
      .editPost(this.topicId(), title, content)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            this.showToast(this.t('forums.topic.toast.postUpdated'), 'success');
          } else {
            // Revert optimistic update on failure
            this.topic!.title = originalTitle;
            this.topic!.comment = originalDescription;
            this.isEditingPost = true;
            this.editPostTitle = submittedTitle;
            this.editPostContent = submittedContent;
            this.showToast(
              this.tParams('forums.topic.toast.postUpdateFailed', {
                error: response?.message || this.t('forums.topic.error.unknown'),
              }),
              'danger'
            );
          }
        }),
        catchError((error: any) => {
          // Revert optimistic update on error
          this.topic!.title = originalTitle;
          this.topic!.comment = originalDescription;
          this.isEditingPost = true;
          this.editPostTitle = submittedTitle;
          this.editPostContent = submittedContent;

          if (error.status === 403) {
            this.showToast(this.t('forums.topic.toast.noEditPostPermission'), 'danger');
          } else {
            this.showToast(
              this.tParams('forums.topic.toast.postUpdateFailed', {
                error:
                  error.error?.message ||
                  error.message ||
                  this.t('forums.topic.error.network'),
              }),
              'danger'
            );
          }
          return of(null);
        }),
        finalize(() => {
          this.isSavingPost = false;
        })
      )
      .subscribe();
  }

  async deletePost() {
    if (!this.topic) return;

    const alert = await this.alertController.create({
      header: this.t('forums.topic.alert.deletePostHeader'),
      message: this.t('forums.topic.alert.deletePostMessage'),
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: this.t('common.delete'),
          role: 'destructive',
          handler: () => {
            this.confirmDeletePost();
          },
        },
      ],
    });

    await alert.present();
  }

  private confirmDeletePost() {
    if (!this.topic) return;

    // Store original topic reference
    const originalTopic = { ...this.topic };

    // Optimistic update - navigate back immediately
    this.navCtrl.back();

    this.forumService.deletePostById(this.topicId()).subscribe({
      next: (response: any) => {
        if (response && response.ok) {
          // Emit event to notify forums component to refresh the list
          this.forumService.emitPostDeleted(this.topicId());
          this.showToast(this.t('forums.topic.toast.postDeleted'), 'success');
        }
      },
      error: (error: any) => {
        if (error.status === 403) {
          this.showToast(this.t('forums.topic.toast.noDeletePostPermission'), 'danger');
        }
      },
    });
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private blockIfProfanity(...texts: string[]): boolean {
    if (!containsProfanityInFields(...texts)) {
      return false;
    }
    void this.showToast(this.t('forums.error.profanity'), 'warning');
    return true;
  }

  private tParams(
    key: string,
    params: Record<string, string | number>,
  ): string {
    return this.translation.translateParams(key, params);
  }
}
