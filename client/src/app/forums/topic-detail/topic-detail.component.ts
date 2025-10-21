import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonicModule,
  NavController,
  ToastController,
} from '@ionic/angular';

import { Share } from '@capacitor/share';
import { of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ForumService } from '@app/shared/services/forum.service';
import {
  CreateCommentDto,
  ForumTopic,
  Comment,
  CreateForumThreadDto,
} from '@app/shared/models/forum';

// Strongly typed interfaces

@Component({
  selector: 'app-topic-detail',
  templateUrl: './topic-detail.component.html',
  styleUrls: ['./topic-detail.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class TopicDetailComponent implements OnInit, OnDestroy {
  // Dependency injection
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private forumService = inject(ForumService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  // Component state
  topic: ForumTopic | null = null;
  comments = signal<Comment[]>([]);
  newComment = '';
  isLoading = false;
  isSubmittingComment = false;
  isSubmittingReply = false;
  isEditingComment: string | null = null;
  editTexts: { [commentId: string]: string } = {};
  errorMessage = '';
  showReplyInput: string | null = null;
  replyTexts: { [commentId: string]: string } = {};
  isEditingPost = false;
  editPostTitle = '';
  editPostContent = '';
  topicId = signal<string | null>(null);
  storeData = signal<any | null>(null);
  router = inject(Router);
  userId = signal<number | null>(null);
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

  ngOnInit() {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      this.userId.set(user.id);
    }

    this.topicId.set(this.route.snapshot.paramMap.get('id'));
    if (this.topicId()) {
      this.loadTopicDetail(this.topicId());
    } else {
      this.errorMessage = 'Topic not found';
    }
  }

  loadTopicDetail(threadId: string | null) {
    if (!threadId) {
      this.errorMessage = 'Topic ID is required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.forumService.fetchThreadById(threadId).subscribe({
      next: (response: any) => {
        if (response?.success) {
          const thread = response.data;

          // Handle paginated response structure
          const pagination = thread.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
          };
          // Find the main topic post (first post or post without parentId)
          if (thread) {
            // Transform API response to component interface
            this.topic = {
              id: threadId,
              title: thread.title || 'Untitled',
              description: thread.description || 'No content',
              author: thread.user?.name || 'Anonymous',
              authorAvatar: thread.user?.profileImage || '',
              category: thread.forum?.title || 'General Discussion',
              replies: pagination.total || thread._count?.posts || 0,
              views: thread.viewCount || 0,
              lastReply: thread.updatedAt || thread.createdAt,
              isPinned: thread.isPinned || false,
              isLocked: thread.isLocked || false,
              tags: [],
              forumId: thread.forum?.id || '',
              createdAt: thread.createdAt || new Date().toISOString(),
              // posts: posts,
            };
          } else {
            // Fallback if no posts found
            this.topic = {
              id: threadId,
              title: 'Untitled',
              description: 'No content available',
              author: 'Anonymous',
              authorAvatar: '',
              category: 'General Discussion',
              replies: 0,
              views: 0,
              lastReply: new Date().toISOString(),
              isPinned: false,
              isLocked: false,
              tags: [],
              forumId: '',
              posts: [],
              createdAt: new Date().toISOString(),
            };
          }

          this.storeData.set(thread);

          // Set comments from the forum_comments array
          const comments = thread.forum_comments || [];

          // Transform API response comments to match component interface
          const transformedComments = comments.map(
            (comment: {
              id: string;
              content: string;
              user?: { id: number; name: string; profileImage: string | null };
              parentId?: string | null;
              createdAt?: string;
              updatedAt?: string;
              replies?: any[];
              isLiked?: boolean;
              _count?: { likes?: number; replies?: number };
            }) => ({
              id: comment.id,
              content: comment.content,
              author: {
                id: comment.user?.id || 0,
                name: comment.user?.name || 'Anonymous',
                profileImage: comment.user?.profileImage || null,
              },
              authorId: comment.user?.id || 0,
              threadId: threadId,
              parentId: comment.parentId || null,
              isDeleted: false,
              createdAt: comment.createdAt || new Date().toISOString(),
              updatedAt: comment.updatedAt || new Date().toISOString(),
              replies: comment.replies || [],
              isLiked: comment.isLiked || false,
              _count: {
                likes: comment._count?.likes || 0,
                replies: comment._count?.replies || 0,
              },
            })
          );

          this.comments.set(transformedComments);
        } else {
          this.errorMessage = 'Failed to load topic details';
        }

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading topic detail:', error);
        this.errorMessage = 'Failed to load topic details';
        this.isLoading = false;
      },
    });
  }

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
    const userId = this.userId();
    debugger;

    const createComment: CreateCommentDto = {
      content: this.newComment.trim(),
      id: topicId!,
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
            // Replace optimistic comment with actual response data
            this.comments.update((comments) =>
              comments.map((comment) =>
                comment.id === optimisticComment.id
                  ? {
                      ...response.data,
                      author: {
                        id: response.data.author?.id || currentUser?.id || 0,
                        name:
                          response.data.author?.name ||
                          currentUser?.name ||
                          'You',
                        profileImage:
                          response.data.author?.profileImage ||
                          currentUser?.profileImage ||
                          null,
                      },
                    }
                  : comment
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
    this.forumService
      .likeComment(commentId)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            const comment = this.comments().find((c) => c.id === commentId);
            if (comment) {
              // Toggle the like status
              comment.isLiked = !comment.isLiked;

              // Update the like count based on the current like status
              if (comment.isLiked) {
                comment._count.likes += 1;
                this.showToast('Liked!', 'success');
              } else {
                comment._count.likes = Math.max(0, comment._count.likes - 1);
                this.forumService.unLikeComment(commentId).subscribe();
                this.showToast('Unliked!', 'success');
              }
            }
          } else {
            this.showToast('Failed to like comment', 'danger');
          }
        }),
        catchError((error: any) => {
          this.showToast('Failed to like comment', 'danger');
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
    debugger;
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
              parentComment.replies.push(response.data);
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
        text: `${this.topic.description.substring(0, 200)}...`,
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

  // Permission check method
  canEditOrDelete(comment: Comment): boolean {
    // In a real app, this would check against actual user data
    return false;
  }

  // Edit functionality
  startEditComment(comment: Comment) {
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
          if (response && response.success) {
            this.comments.set(
              this.comments().map((c) =>
                c.id === comment.id ? response.data : c
              )
            );
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
    // Store the original comment reference and position
    const originalComment = { ...comment };
    const commentIndex = this.comments().findIndex((c) => c.id === comment.id);
    const isReply = !!comment.parentId;

    // Optimistic update - remove from UI immediately
    if (commentIndex !== -1 && !isReply) {
      this.comments().splice(commentIndex, 1);
    }

    // Also check and remove from replies if it's a reply
    if (isReply) {
      this.comments().forEach((parentComment) => {
        if (parentComment.replies) {
          const replyIndex = parentComment.replies.findIndex(
            (r) => r.id === comment.id
          );
          if (replyIndex !== -1) {
            parentComment.replies.splice(replyIndex, 1);
            parentComment._count.replies -= 1;
          }
        }
      });
    }

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
    if (comment.parentId) {
      // It's a reply, add back to parent comment
      const parentComment = this.comments().find(
        (c) => c.id === comment.parentId
      );
      if (parentComment) {
        if (!parentComment.replies) parentComment.replies = [];
        parentComment.replies.push(comment);
        parentComment._count.replies += 1;
      }
    } else {
      // It's a top-level comment, add back to comments array at original position
      if (originalIndex !== -1) {
        this.comments().splice(originalIndex, 0, comment);
      } else {
        // If original index not found, add to the end
        this.comments().push(comment);
      }
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // Manual refresh method
  refreshTopic(): void {
    console.log('🔄 TopicDetail: Manual refresh triggered');
    if (this.topicId()) {
      this.loadTopicDetail(this.topicId());
      this.showToast('Refreshing topic...', 'primary');
    }
  }

  startEditPost() {
    if (!this.topic) return;
    this.isEditingPost = true;
    this.editPostTitle = this.topic.title;
    this.editPostContent = this.topic.description;
  }

  cancelEditPost() {
    this.isEditingPost = false;
    this.editPostTitle = '';
    this.editPostContent = '';
  }

  async submitEditPost() {
    if (!this.topic) return;
    const title = this.editPostTitle.trim();
    const content = this.editPostContent.trim();

    if (!title || !content) {
      await this.showToast('Please provide both title and content', 'warning');
      return;
    }

    if (title === this.topic.title && content === this.topic.description) {
      this.cancelEditPost();
      return;
    }

    // Optimistic update
    const originalTitle = this.topic.title;
    const originalDescription = this.topic.description;
    this.topic.title = title;
    this.topic.description = content;
    this.forumService
      .editPost(this.topicId(), title, content)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            this.showToast('Post updated successfully!', 'success');
          } else {
            // Revert optimistic update on failure
            this.topic!.title = originalTitle;
            this.topic!.description = originalDescription;
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
          this.topic!.description = originalDescription;

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
          this.cancelEditPost();
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
