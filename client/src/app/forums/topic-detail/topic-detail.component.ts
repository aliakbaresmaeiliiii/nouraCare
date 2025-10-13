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
import { CreateForumThreadDto, CreatePostDto, ForumService, ThreadDetailResponse } from '@app/shared/services/forum.service';


// Strongly typed interfaces
interface ForumTopic {
  id: number;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  category: string;
  replies: number;
  views: number;
  lastReply: string;
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];
  forumId: string;
  forum?: Forum[];
  createdAt: string;
  posts?: Comment[];
}

interface Forum {
  categoryId: string;
  createdAt: string;
  createdById: number;
  description: string;
  id: string;
  isActive: boolean;
  isPublic: boolean;
  category: Categories[];
  title: string;
  updatedAt: string;
}

interface Categories {
  color: string;
  createdAt: string;
  description: string;
  icon: string;
  id: string;
  isActive: boolean;
  name: string;
  order: number;
  slug: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: number;
    name: string;
    profileImage: string | null;
  };
  authorId: number;
  threadId: string;
  parentId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
  isLiked?: boolean;
  _count: {
    likes: number;
    replies: number;
  };
}

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
  comments: Comment[] = [];
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
    this.topicId.set(this.route.snapshot.paramMap.get('id'));
    if (this.topicId()) {
      this.loadTopicDetail(this.topicId());
    } else {
      this.errorMessage = 'Topic not found';
    }
  }

  loadTopicDetail(threadId: string | null) {
    this.isLoading = true;
    this.errorMessage = '';
    this.forumService.getThreadById(threadId).subscribe({
      next: (response: ThreadDetailResponse) => {
        if (response && response.success) {
          const thread = response.data;
          this.topic = {
            id: parseInt(threadId || '0'),
            title: thread.title,
            content: thread.content,
            author: thread.author?.name || 'Anonymous',
            authorAvatar: thread.author?.profileImage || '',
            category: thread.forum?.title || 'General Discussion',
            replies: thread._count?.posts || 0,
            views: thread.viewCount || 0,
            lastReply: thread.updatedAt,
            isPinned: thread.isPinned || false,
            isLocked: thread.isLocked || false,
            tags: [],
            forumId: thread.forum?.id || '',
            createdAt: thread.createdAt,
            posts: thread.posts || [],
          };
          this.storeData.set(response.data);

          // Load comments from the thread response
          this.comments = thread.posts || [];
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
    const threadId = this.storeData().id;

    const postData: CreatePostDto = {
      content: this.newComment.trim(),
      threadId: threadId,
      parentId: null,
    };

    this.forumService
      .createPost(postData)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            this.comments.unshift(response.data);
            this.newComment = '';
            this.showToast('Comment posted successfully!', 'success');
          } else {
            this.showToast(
              'Failed to post comment: ' +
                (response?.message || 'Unknown error'),
              'danger'
            );
          }
        }),
        catchError((error: any) => {
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
      .likePost(commentId)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            const comment = this.comments.find((c) => c.id === commentId);
            if (comment) {
              // Toggle the like status
              comment.isLiked = !comment.isLiked;
              
              // Update the like count based on the current like status
              if (comment.isLiked) {
                comment._count.likes += 1;
                this.showToast('Liked!', 'success');
              } else {
                comment._count.likes = Math.max(0, comment._count.likes - 1);
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
    const forumId = this.topic?.forumId || '';
    if (!replyText) {
      this.showToast('Please write a reply', 'warning');
      return;
    }

    if (!this.topic) {
      this.showToast('Topic not found', 'danger');
      return;
    }

    this.isSubmittingReply = true;

    // Add null checks for posts array
    if (!this.topic?.posts || this.topic.posts.length === 0) {
      this.showToast(
        'Unable to submit reply: topic data is incomplete',
        'danger'
      );
      this.isSubmittingReply = false;
      return;
    }

    const payload = {
      content: replyText,
      threadId: this.topic.posts[0].threadId,
      parentId: commentId,
      forumId: forumId,
    };

    this.forumService
      .replyToComment(payload)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            // Find the parent comment and add the reply
            const parentComment = this.comments.find((c) => c.id === commentId);
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
      target.src = '';
    }
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
        text: `${this.topic.content.substring(0, 200)}...`,
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
    debugger;
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
            this.comments = this.comments.map((c) =>
              c.id === comment.id ? response.data : c
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
    const commentIndex = this.comments.findIndex((c) => c.id === comment.id);
    const isReply = !!comment.parentId;

    // Optimistic update - remove from UI immediately
    if (commentIndex !== -1 && !isReply) {
      this.comments.splice(commentIndex, 1);
    }

    // Also check and remove from replies if it's a reply
    if (isReply) {
      this.comments.forEach((parentComment) => {
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
      const parentComment = this.comments.find(
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
        this.comments.splice(originalIndex, 0, comment);
      } else {
        // If original index not found, add to the end
        this.comments.push(comment);
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
    this.editPostContent = this.topic.content;
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

    if (title === this.topic.title && content === this.topic.content) {
      this.cancelEditPost();
      return;
    }

    // Optimistic update
    const originalTitle = this.topic.title;
    const originalContent = this.topic.content;
    this.topic.title = title;
    this.topic.content = content;
    this.forumService
      .editPost(this.topicId(), title, content)
      .pipe(
        tap((response: any) => {
          if (response && response.success) {
            this.showToast('Post updated successfully!', 'success');
          } else {
            // Revert optimistic update on failure
            this.topic!.title = originalTitle;
            this.topic!.content = originalContent;
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
          this.topic!.content = originalContent;

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
