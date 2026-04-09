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
} from '../../shared/models/forum';
import { ForumService } from '../../shared/services/forum.service';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';

// Strongly typed interfaces

@Component({
  selector: 'app-topic-detail',
  templateUrl: './topic-detail.component.html',
  styleUrls: ['./topic-detail.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class TopicDetailComponent implements OnInit, OnDestroy, ViewWillEnter {
  // Dependency injection
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private forumService = inject(ForumService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

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
          name: 'Community member',
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
            name: 'Community member',
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
      title: topic.title || 'Untitled',
      comment: topic.comment || topic.content || '',
      author: topic.author || topic.user?.fullName || 'Anonymous',
      authorAvatar:
        topic.authorAvatar ||
        topic.user?.profileImage ||
        topic.user?.user_profile?.avatarUrl ||
        '/assets/images/nurse.png',
      category: topic.category || 'General Discussion',
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
        fullName: topic.author || 'Anonymous',
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
      this.errorMessage = 'Topic not found';
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
  //   this.forumService
  //     .fetchThreadById(threadId)
  //     .pipe(
  //       finalize(() => {
  //         // Always stop loader, even if mapping/parsing fails
  //         this.isLoading.set(false);

  //       })
  //     )
  //     .subscribe({
  //     next: (response: any) => {
  //       // Stop loader as soon as we get any response payload
        
  //       if (response?.success) {
  //         this.isLoading.set(false);

  //         try {
  //           // API can return either { success, data } or flattened { success, ...threadFields }
  //           const thread = response?.data || response;
  //           const threadPostsCount = thread?._count?.posts || thread?.forum_posts?.length || 0;

  //           // Handle paginated response structure safely
  //           const pagination = thread?.pagination || {
  //             page: 1,
  //             limit: 20,
  //             total: 0,
  //             totalPages: 1,
  //           };
  //           // Find the main topic post (first post or post without parentId)
  //           if (thread) {
  //             // Transform API response to component interface
  //             this.topic = {
  //               id: threadId,
  //               title: thread.title || 'Untitled',
  //               description: thread.content || 'No content',
  //               author: thread.user?.fullName || 'Anonymous',
  //               authorAvatar: thread.user?.profileImage || '',
  //               category:
  //                 thread.forums?.title ||
  //                 thread.forum?.title ||
  //                 'General Discussion',
  //               replies: pagination.total || threadPostsCount,
  //               views: thread.viewCount || 0,
  //               lastReply: thread.updatedAt || thread.createdAt,
  //               isPinned: thread.isPinned || false,
  //               isLocked: thread.isLocked || false,
  //               likeCount: thread.likeCount || 0,
  //               forumPosts: thread.forum_posts || [],
  //               tags: [],
  //               user: {
  //                 id: thread.user?.id || 0,
  //                 fullName: thread.user?.fullName || 'Anonymous',
  //                 profileImage:
  //                   thread.user?.user_profile?.avatarUrl ||
  //                   thread.user?.profileImage ||
  //                   '',
  //               },
  //               forumId: thread.forumId || thread.forums?.id || thread.forum?.id || '',
  //               createdAt: thread.createdAt || new Date().toISOString(),
  //             };
  //           } else {
  //             // Fallback if no posts found
  //             this.topic = {
  //               id: threadId,
  //               title: 'Untitled',
  //               description: 'No content available',
  //               author: 'Anonymous',
  //               authorAvatar: '',
  //               category: 'General Discussion',
  //               replies: 0,
  //               views: 0,
  //               lastReply: new Date().toISOString(),
  //               isPinned: false,
  //               isLocked: false,
  //               likeCount: 0,
  //               tags: [],
  //               forumId: '',
  //               posts: [],
  //               forumPosts: [],
  //               user: {
  //                 id: 0,
  //                 fullName: 'Anonymous',
  //                 profileImage: '',
  //               },
  //               createdAt: new Date().toISOString(),
  //             };
  //           }

  //           this.storeData.set(thread);

  //           // Set comments from the forum_comments array
  //           const comments = thread?.forum_comments || [];

  //           // Transform API response comments to match component interface
  //           const transformedComments = comments.map(
  //             (comment: {
  //               id: string;
  //               content: string;
  //               user?: { id: number; name?: string; fullName?: string; profileImage: string | null };
  //               parentId?: string | null;
  //               createdAt?: string;
  //               updatedAt?: string;
  //               replies?: any[];
  //               isLiked?: boolean;
  //               likeCount: number;
  //               dislikeCount: number;
  //               _count?: { likes?: number; replies?: number };
  //             }) => ({
  //               id: comment.id,
  //               content: comment.content,
  //               author: {
  //                 id: comment.user?.id || 0,
  //                 name: comment.user?.fullName || comment.user?.name || 'Anonymous',
  //                 profileImage: comment.user?.profileImage || null,
  //               },
  //               authorId: comment.user?.id || 0,
  //               threadId: threadId,
  //               parentId: comment.parentId || null,
  //               isDeleted: false,
  //               createdAt: comment.createdAt || new Date().toISOString(),
  //               updatedAt: comment.updatedAt || new Date().toISOString(),
  //               replies: comment.replies || [],
  //               isLiked: comment.isLiked || false,
  //               _count: {
  //                 likes: comment.likeCount || 0,
  //                 replies: comment._count?.replies || 0,
  //               },
  //             })
  //           );

  //           this.comments.set(transformedComments);
  //         } catch (e) {
  //           console.error('Error mapping topic detail payload:', e);
  //           this.errorMessage = 'Failed to render topic details';
  //           this.isLoading.set(false);


  //         }
  //       } else {
  //         this.errorMessage = 'Failed to load topic details';
  //         this.isLoading.set(false);

  //       }
  //     },
  //     error: (error: any) => {
  //       console.error('Error loading topic detail:', error);
  //       this.errorMessage = 'Failed to load topic details';
  //     },
  //   });
  // }

  submitComment() {
    if (!this.newComment.trim()) {
      this.showToast('Please write a comment', 'warning');
      return;
    }

    if (!this.topic) {
      this.showToast('Topic not found', 'danger');
      return;
    }

    this.isSubmittingComment = true;
    const topicId = this.topicId();

    const createComment: CreateCommentDto = {
      content: this.newComment.trim(),
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
        name: currentUser?.name || 'You',
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
              name: currentUser?.name || currentUser?.fullName || 'You',
              profileImage:
                currentUser?.profileImage ?? mapped.author.profileImage,
            };
            mapped.authorId = currentUser?.id ?? mapped.authorId;
            this.comments.update((comments) =>
              comments.map((comment) =>
                comment.id === optimisticComment.id ? mapped : comment
              )
            );
            this.showToast('Comment posted successfully!', 'success');
          } else {
            // Remove optimistic comment on failure
            this.comments.update((comments) =>
              comments.filter((comment) => comment.id !== optimisticComment.id)
            );
            this.showToast(
              'Failed to post comment: ' +
                (response?.message || 'Unknown error'),
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
            'Failed to post comment: ' +
              (error.error?.message || error.message || 'Network error'),
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
              isLike ? 'Comment liked!' : 'Comment disliked!',
              'success'
            );
          } else {
            applyLikeState(previousLiked, previousLikes);
            this.showToast('Failed to update like status', 'danger');
          }
        }),
        catchError((error: any) => {
          applyLikeState(previousLiked, previousLikes);
          this.showToast('Failed to update like status', 'danger');
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
      this.showToast('Please write a reply', 'warning');
      return;
    }

    if (!this.topic) {
      this.showToast('Topic not found', 'danger');
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
                name: currentUser?.name || currentUser?.fullName || 'You',
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
            this.showToast('Reply posted successfully!', 'success');
          } else {
            this.showToast(
              'Failed to post reply: ' + (response?.message || 'Unknown error'),
              'danger'
            );
          }
        }),
        catchError((error: any) => {
          this.showToast(
            'Failed to post reply: ' +
              (error.error?.message || error.message || 'Network error'),
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
            this.showToast('Forum thread created successfully!', 'success');
            // Optionally navigate to the new thread or refresh the list
          } else {
            this.showToast(
              'Failed to create forum thread: ' +
                (response?.message || 'Unknown error'),
              'danger'
            );
          }
        }),
        catchError((error: any) => {
          this.showToast(
            'Failed to create forum thread: ' +
              (error.error?.message || error.message || 'Network error'),
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
      '#ffc409',
      '#eb445a',
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
        return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
      } else if (diffHours > 0) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes < 1 ? 'just now' : `${diffMinutes} minutes ago`;
      }
    } catch (error) {
      return 'recently';
    }
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
      await this.showToast('Topic not available for sharing', 'warning');
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
        await this.showToast('Topic shared successfully!', 'success');
        return;
      }

      await Share.share(shareData);
      await this.showToast('Topic shared successfully!', 'success');
    } catch (error) {
      console.error('Error sharing topic:', error);
      await this.showToast(
        'Failed to share topic. Please try again.',
        'danger'
      );
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
      this.showToast('You can only edit your own comments', 'danger');
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
      await this.showToast('You can only edit your own comments', 'danger');
      this.cancelEdit();
      return;
    }

    const editText = this.editTexts[comment.id]?.trim();
    if (!editText) {
      await this.showToast('Please write something to edit', 'warning');
      return;
    }

    if (editText === comment.content) {
      this.cancelEdit();
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
            this.showToast('Comment updated successfully!', 'success');
          } else {
            // Revert optimistic update on failure
            comment.content = originalContent;
            this.showToast(
              'Failed to update comment: ' +
                (response?.message || 'Unknown error'),
              'danger'
            );
          }
        }),
        catchError((error: any) => {
          // Revert optimistic update on error
          comment.content = originalContent;

          if (error.status === 403) {
            this.showToast(
              'You do not have permission to edit this comment',
              'danger'
            );
          } else {
            this.showToast(
              'Failed to update comment: ' +
                (error.error?.message || error.message || 'Network error'),
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
      await this.showToast('You can only delete your own comments', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Delete Comment',
      message:
        'Are you sure you want to delete this comment? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.confirmDeleteComment(comment);
          },
        },
      ],
    });

    await alert.present();
  }

  private confirmDeleteComment(comment: Comment) {
    if (!this.canEditOrDelete(comment)) {
      this.showToast('You can only delete your own comments', 'danger');
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
            this.showToast('Comment deleted successfully!', 'success');
          } else {
            // Revert optimistic update on failure
            this.revertCommentDeletion(originalComment, commentIndex);
            this.showToast(
              'Failed to delete comment: ' +
                (response?.message || 'Unknown error'),
              'danger'
            );
          }
        }),
        catchError((error: any) => {
          // Revert optimistic update on error
          this.revertCommentDeletion(originalComment, commentIndex);

          if (error.status === 403) {
            this.showToast(
              'You do not have permission to delete this comment',
              'danger'
            );
          } else {
            this.showToast(
              'Failed to delete comment: ' +
                (error.error?.message || error.message || 'Network error'),
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
            'Failed to refresh topic: ' +
              (error?.message || 'Network error'),
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
      await this.showToast('Please provide both title and content', 'warning');
      return;
    }

    if (title === this.topic.title && content === this.topic.comment) {
      this.cancelEditPost();
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
            this.showToast('Post updated successfully!', 'success');
          } else {
            // Revert optimistic update on failure
            this.topic!.title = originalTitle;
            this.topic!.comment = originalDescription;
            this.isEditingPost = true;
            this.editPostTitle = submittedTitle;
            this.editPostContent = submittedContent;
            this.showToast(
              'Failed to update post: ' +
                (response?.message || 'Unknown error'),
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
            this.showToast(
              'You do not have permission to edit this post',
              'danger'
            );
          } else {
            this.showToast(
              'Failed to update post: ' +
                (error.error?.message || error.message || 'Network error'),
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
      header: 'Delete Post',
      message:
        'Are you sure you want to delete this post? This action cannot be undone and will delete all comments as well.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Delete',
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
          this.showToast('Post deleted successfully!', 'success');
        }
      },
      error: (error: any) => {
        if (error.status === 403) {
          this.showToast(
            'You do not have permission to delete this post',
            'danger'
          );
        }
      },
    });
  }
}
