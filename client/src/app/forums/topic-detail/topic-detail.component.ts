import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, NavController, AlertController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ForumThreadsService, CreatePostDto, ThreadDetailResponse, PostResponse, LikeResponse } from '../../shared/services/forum-threads.service';
import { Share } from '@capacitor/share';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CurrentUser, MOCK_CURRENT_USER, Comment as ForumComment } from '../../shared/interfaces/forum.interface';

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
  createdAt: string;
  posts?: any[];
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
  replies: any[];
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
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TopicDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private forumThreadsService = inject(ForumThreadsService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

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
  currentUser: CurrentUser = MOCK_CURRENT_USER;

  ngOnInit() {
    const topicId = this.route.snapshot.paramMap.get('id');
    if (topicId) {
      this.loadTopicDetail(topicId);
    } else {
      this.errorMessage = 'Topic not found';
    }
  }

  loadTopicDetail(topicId: string) {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.forumThreadsService.getThreadById(topicId).subscribe({
      next: (response: any) => {
        console.log('Topic detail response:', response);
        if (response && response.success) {
          const thread = response.data;
          this.topic = {
            id: parseInt(topicId),
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
            createdAt: thread.createdAt,
            posts: thread.posts || []
          };
          
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
        
        // Fallback to mock data if API fails
        this.loadMockTopicDetail(topicId);
      }
    });
  }

  private loadMockTopicDetail(topicId: string) {
    this.topic = {
      id: parseInt(topicId),
      title: 'Best natural remedies for period cramps',
      content: 'I\'ve been experiencing severe cramps lately and looking for natural remedies that actually work. I\'ve tried heating pads and they help a bit, but I\'m looking for more suggestions. What has worked for you all?',
      author: 'Sarah Johnson',
      authorAvatar: '',
      category: 'General Discussion',
      replies: 23,
      views: 156,
      lastReply: '2024-01-15T10:30:00Z',
      isPinned: true,
      isLocked: false,
      tags: ['period', 'cramps', 'natural-remedies'],
      createdAt: '2024-01-10T14:20:00Z'
    };
  }

 



  async submitComment() {
    if (!this.newComment.trim()) {
      await this.showToast('Please write a comment', 'warning');
      return;
    }

    if (!this.topic) {
      await this.showToast('Topic not found', 'danger');
      return;
    }

    this.isSubmittingComment = true;

    const postData: CreatePostDto = {
      content: this.newComment.trim(),
      threadId: this.topic.id.toString(),
      parentId: null
    };

    this.forumThreadsService.createPost(postData)
      .pipe(
        tap((response: any) => {
          console.log('Comment created successfully:', response);
          if (response && response.success) {
            this.comments.unshift(response.data);
            this.newComment = '';
            this.showToast('Comment posted successfully!', 'success');
          } else {
            console.error('API returned unsuccessful response:', response);
            this.showToast('Failed to post comment: ' + (response?.message || 'Unknown error'), 'danger');
          }
        }),
        catchError((error: any) => {
          console.error('Error posting comment:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
            error: error.error
          });
          this.showToast('Failed to post comment: ' + (error.error?.message || error.message || 'Network error'), 'danger');
          
          // Fallback to mock comment creation
          this.createMockComment();
          return of(null);
        }),
        finalize(() => {
          this.isSubmittingComment = false;
        })
      )
      .subscribe();
  }

  private createMockComment() {
    if (!this.topic) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      content: this.newComment.trim(),
      authorId: 1, // Current user ID
      threadId: this.topic.id.toString(),
      parentId: null,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: 1,
        name: 'Current User',
        profileImage: ''
      },
      replies: [],
      isLiked: false,
      _count: {
        likes: 0,
        replies: 0
      }
    };

    this.comments.unshift(newComment);
    this.newComment = '';
    this.showToast('Comment posted successfully!', 'success');
  }

  async likeComment(commentId: string) {
    this.forumThreadsService.likePost(commentId)
      .pipe(
        tap((response: any) => {
          console.log('Like response:', response);
          if (response && response.success) {
            const comment = this.comments.find(c => c.id === commentId);
            if (comment) {
              comment.isLiked = response.data.liked;
              comment._count.likes += response.data.liked ? 1 : -1;
              this.showToast(response.data.liked ? 'Liked!' : 'Unliked!', 'success');
            }
          } else {
            this.showToast('Failed to like comment', 'danger');
            // Fallback to mock like functionality
            this.mockLikeComment(commentId);
          }
        }),
        catchError((error: any) => {
          console.error('Error liking comment:', error);
          this.showToast('Failed to like comment', 'danger');
          // Fallback to mock like functionality
          this.mockLikeComment(commentId);
          return of(null);
        })
      )
      .subscribe();
  }

  private async mockLikeComment(commentId: string) {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      comment.isLiked = !comment.isLiked;
      comment._count.likes += comment.isLiked ? 1 : -1;
      await this.showToast(comment.isLiked ? 'Liked!' : 'Unliked!', 'success');
    }
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
    Object.keys(this.replyTexts).forEach(key => {
      this.replyTexts[key] = '';
    });
  }

  async submitReply(commentId: string) {
    debugger;
    const replyText = this.replyTexts[commentId]?.trim();
    if (!replyText) {
      await this.showToast('Please write a reply', 'warning');
      return;
    }

    if (!this.topic) {
      await this.showToast('Topic not found', 'danger');
      return;
    }

    this.isSubmittingReply = true;

    this.forumThreadsService.replyToComment(commentId, replyText, '20f98c91-f30f-4110-8792-fcbd88372052'.toString())
      .pipe(
        tap((response: any) => {
          console.log('Reply created successfully:', response);
          if (response && response.success) {
            // Find the parent comment and add the reply
            const parentComment = this.comments.find(c => c.id === commentId);
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
            console.error('API returned unsuccessful response:', response);
            this.showToast('Failed to post reply: ' + (response?.message || 'Unknown error'), 'danger');
          }
        }),
        catchError((error: any) => {
          console.error('Error posting reply:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
            error: error.error
          });
          this.showToast('Failed to post reply: ' + (error.error?.message || error.message || 'Network error'), 'danger');
          
          // Fallback to mock reply creation
          this.createMockReply(commentId, replyText);
          return of(null);
        }),
        finalize(() => {
          this.isSubmittingReply = false;
        })
      )
      .subscribe();
  }

  private createMockReply(commentId: string, replyText: string) {
    if (!this.topic) return;
    
    const parentComment = this.comments.find(c => c.id === commentId);
    if (!parentComment) return;
    
    const newReply: Comment = {
      id: Date.now().toString(),
      content: replyText,
      authorId: 1, // Current user ID
      threadId: this.topic.id.toString(),
      parentId: commentId,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: 1,
        name: 'Current User',
        profileImage: ''
      },
      replies: [],
      isLiked: false,
      _count: {
        likes: 0,
        replies: 0
      }
    };

    if (!parentComment.replies) {
      parentComment.replies = [];
    }
    parentComment.replies.push(newReply);
    parentComment._count.replies += 1;
    
    this.replyTexts[commentId] = '';
    this.showReplyInput = null;
    this.showToast('Reply posted successfully!', 'success');
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
      position: 'bottom'
    });
    await toast.present();
  }

  async shareTopic() {
    if (!this.topic) {
      await this.showToast('Topic not available for sharing', 'warning');
      return;
    }

    try {
      // Create share data
      const shareData = {
        title: this.topic.title,
        text: `${this.topic.content.substring(0, 200)}...`,
        url: `${window.location.origin}/forums/topic/${this.topic.id}`
      };

      // Try Web Share API first (works on mobile browsers)
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          await this.showToast('Topic shared successfully!', 'success');
          return;
        } catch (error) {
          console.log('Web Share API failed:', error);
          // Continue to fallback methods
        }
      }

      // Try Capacitor Share plugin (for native apps)
      try {
        await Share.share(shareData);
        await this.showToast('Topic shared successfully!', 'success');
        return;
      } catch (error) {
        console.log('Capacitor Share failed:', error);
        // Continue to fallback methods
      }

      // Fallback: Show share options dialog
      await this.showShareOptions(shareData);

    } catch (error) {
      console.error('Error sharing topic:', error);
      await this.showToast('Failed to share topic. Please try again.', 'danger');
    }
  }

  private async showShareOptions(shareData: any) {
    const alert = await this.alertController.create({
      header: 'Share Topic',
      message: 'Choose how you\'d like to share this topic:',
      buttons: [
        {
          text: 'Copy Link',
          handler: () => {
            this.copyToClipboard(shareData.url);
          }
        },
        {
          text: 'Share via Message',
          handler: () => {
            this.shareViaMessage(shareData);
          }
        },
        {
          text: 'Share via Email',
          handler: () => {
            this.shareViaEmail(shareData);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  private async copyToClipboard(text: string) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        await this.showToast('Link copied to clipboard!', 'success');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        await this.showToast('Link copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      await this.showToast('Failed to copy link', 'danger');
    }
  }

  private shareViaMessage(shareData: any) {
    const messageText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
    const encodedMessage = encodeURIComponent(messageText);
    
    // Try WhatsApp first
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    // If WhatsApp fails, try SMS
    setTimeout(() => {
      const smsUrl = `sms:?body=${encodedMessage}`;
      window.open(smsUrl, '_blank');
    }, 100);
  }

  private shareViaEmail(shareData: any) {
    const subject = encodeURIComponent(`Check out this topic: ${shareData.title}`);
    const body = encodeURIComponent(`${shareData.text}\n\nRead more: ${shareData.url}`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(emailUrl, '_blank');
  }

  // Permission check method
  canEditOrDelete(comment: Comment): boolean {
    return this.currentUser.id === comment.authorId || this.currentUser.role === 'admin';
  }

  // Edit functionality
  startEditComment(comment: Comment) {
    this.isEditingComment = comment.id;
    this.editTexts[comment.id] = comment.content;
  }

  cancelEdit() {
    this.isEditingComment = null;
    Object.keys(this.editTexts).forEach(key => {
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

    this.forumThreadsService.editComment(comment.id, editText)
      .pipe(
        tap((response: any) => {
          console.log('Comment updated successfully:', response);
          if (response && response.success) {
            this.comments = this.comments.map(c => c.id === comment.id ? response.data : c);
            this.showToast('Comment updated successfully!', 'success');
          } else {
            // Revert optimistic update on failure
            comment.content = originalContent;
            this.showToast('Failed to update comment: ' + (response?.message || 'Unknown error'), 'danger');
          }
        }),
        catchError((error: any) => {
          console.error('Error updating comment:', error);
          // Revert optimistic update on error
          comment.content = originalContent;
          
          if (error.status === 403) {
            this.showToast('You do not have permission to edit this comment', 'danger');
          } else {
            this.showToast('Failed to update comment: ' + (error.error?.message || error.message || 'Network error'), 'danger');
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
      message: 'Are you sure you want to delete this comment? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.confirmDeleteComment(comment);
          }
        }
      ]
    });

    await alert.present();
  }

  private confirmDeleteComment(comment: Comment) {
    // Optimistic update - remove from UI immediately
    const commentIndex = this.comments.findIndex(c => c.id === comment.id);
    if (commentIndex !== -1) {
      this.comments.splice(commentIndex, 1);
    }

    // Also check and remove from replies if it's a reply
    this.comments.forEach(parentComment => {
      if (parentComment.replies) {
        const replyIndex = parentComment.replies.findIndex(r => r.id === comment.id);
        if (replyIndex !== -1) {
          parentComment.replies.splice(replyIndex, 1);
          parentComment._count.replies -= 1;
        }
      }
    });

    this.forumThreadsService.deletePost(comment.id)
      .pipe(
        tap((response: any) => {
          console.log('Comment deleted successfully:', response);
          if (response && response.success) {
            this.showToast('Comment deleted successfully!', 'success');
          } else {
            // Revert optimistic update on failure
            if (comment.parentId) {
              // It's a reply, add back to parent comment
              const parentComment = this.comments.find(c => c.id === comment.parentId);
              if (parentComment) {
                if (!parentComment.replies) parentComment.replies = [];
                parentComment.replies.push(comment);
                parentComment._count.replies += 1;
              }
            } else {
              // It's a top-level comment, add back to comments array
              this.comments.splice(commentIndex, 0, comment);
            }
            this.showToast('Failed to delete comment: ' + (response?.message || 'Unknown error'), 'danger');
          }
        }),
        catchError((error: any) => {
          console.error('Error deleting comment:', error);
          // Revert optimistic update on error
          if (comment.parentId) {
            // It's a reply, add back to parent comment
            const parentComment = this.comments.find(c => c.id === comment.parentId);
            if (parentComment) {
              if (!parentComment.replies) parentComment.replies = [];
              parentComment.replies.push(comment);
              parentComment._count.replies += 1;
            }
          } else {
            // It's a top-level comment, add back to comments array
            this.comments.splice(commentIndex, 0, comment);
          }
          
          if (error.status === 403) {
            this.showToast('You do not have permission to delete this comment', 'danger');
          } else {
            this.showToast('Failed to delete comment: ' + (error.error?.message || error.message || 'Network error'), 'danger');
          }
          return of(null);
        })
      )
      .subscribe();
  }
}
