import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, NavController, AlertController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ForumThreadsService, CreatePostDto, ThreadDetailResponse, PostResponse, LikeResponse } from '../../shared/services/forum-threads.service';
import { Share } from '@capacitor/share';

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
  errorMessage = '';

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

    try {
      const postData: CreatePostDto = {
        content: this.newComment.trim(),
        threadId: this.topic.id.toString(),
        parentId: null
      };

      this.forumThreadsService.createPost(postData).subscribe({
        next: (response: any) => {
          console.log('Comment created successfully:', response);
          if (response && response.success) {
            this.comments.unshift(response.data);
            this.newComment = '';
            this.showToast('Comment posted successfully!', 'success');
          } else {
            this.showToast('Failed to post comment', 'danger');
          }
          this.isSubmittingComment = false;
        },
        error: (error: any) => {
          console.error('Error posting comment:', error);
          this.showToast('Failed to post comment', 'danger');
          this.isSubmittingComment = false;
          
          // Fallback to mock comment creation
          this.createMockComment();
        }
      });

    } catch (error) {
      console.error('Error posting comment:', error);
      await this.showToast('Failed to post comment. Please try again.', 'danger');
      this.isSubmittingComment = false;
    }
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
    this.forumThreadsService.likePost(commentId).subscribe({
      next: (response: any) => {
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
      },
      error: (error: any) => {
        console.error('Error liking comment:', error);
        this.showToast('Failed to like comment', 'danger');
        // Fallback to mock like functionality
        this.mockLikeComment(commentId);
      }
    });
  }

  private async mockLikeComment(commentId: string) {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      comment.isLiked = !comment.isLiked;
      comment._count.likes += comment.isLiked ? 1 : -1;
      await this.showToast(comment.isLiked ? 'Liked!' : 'Unliked!', 'success');
    }
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
}
