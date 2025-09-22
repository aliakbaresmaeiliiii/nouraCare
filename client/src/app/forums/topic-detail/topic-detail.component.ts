import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { SecretChatsService } from '../../secret-chats/services/secret-chat.service';
import { 
  CreateCommentDto,
  Comment 
} from '../../secret-chats/secret.chats.dto';

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
  private secretChatsService = inject(SecretChatsService);
  private toastController = inject(ToastController);

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
      this.loadComments(topicId);
    } else {
      this.errorMessage = 'Topic not found';
    }
  }

  loadTopicDetail(topicId: string) {
    this.isLoading = true;
    // TODO: Replace with actual API call
    // For now, we'll use mock data similar to forums component
    setTimeout(() => {
      this.topic = {
        id: parseInt(topicId),
        title: 'Best natural remedies for period cramps',
        content: 'I\'ve been experiencing severe cramps lately and looking for natural remedies that actually work. I\'ve tried heating pads and they help a bit, but I\'m looking for more suggestions. What has worked for you all?',
        author: 'Sarah Johnson',
        authorAvatar: 'assets/images/nurse.png',
        category: 'General Discussion',
        replies: 23,
        views: 156,
        lastReply: '2024-01-15T10:30:00Z',
        isPinned: true,
        isLocked: false,
        tags: ['period', 'cramps', 'natural-remedies'],
        createdAt: '2024-01-10T14:20:00Z'
      };
      this.isLoading = false;
    }, 1000);
  }

  loadComments(topicId: string) {
    // TODO: Replace with actual API call
    // this.secretChatsService.getPostComments(topicId).subscribe({
    //   next: (response) => {
    //     this.comments = response.data || [];
    //   },
    //   error: (error) => {
    //     console.error('Error loading comments:', error);
    //     this.errorMessage = 'Failed to load comments';
    //   }
    // });

    // Mock comments for now
    setTimeout(() => {
      this.comments = [
        {
          id: '1',
          content: 'I find that ginger tea works wonders for my cramps! I drink it 2-3 times a day during my period.',
          postId: topicId,
          authorId: 2,
          parentId: null,
          isAnonymous: false,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          author: {
            id: 2,
            name: 'Emily Chen',
            email: 'emily@example.com',
            profileImage: 'assets/images/nurse.png'
          },
          replies: [],
          isLiked: false,
          _count: {
            likes: 5,
            replies: 2
          }
        },
        {
          id: '2',
          content: 'Magnesium supplements have been a game changer for me. I take them daily and my cramps are much more manageable now.',
          postId: topicId,
          authorId: 3,
          parentId: null,
          isAnonymous: false,
          createdAt: '2024-01-15T09:15:00Z',
          updatedAt: '2024-01-15T09:15:00Z',
          author: {
            id: 3,
            name: 'Maria Rodriguez',
            email: 'maria@example.com',
            profileImage: 'assets/images/nurse.png'
          },
          replies: [],
          isLiked: true,
          _count: {
            likes: 8,
            replies: 1
          }
        }
      ];
    }, 1500);
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
      const commentData: CreateCommentDto = {
        content: this.newComment.trim(),
        postId: this.topic.id.toString(),
        isAnonymous: false
      };

      // TODO: Replace with actual API call
      // this.secretChatsService.createComment(commentData).subscribe({
      //   next: (comment) => {
      //     this.comments.unshift(comment);
      //     this.newComment = '';
      //     this.showToast('Comment posted successfully!', 'success');
      //   },
      //   error: (error) => {
      //     console.error('Error posting comment:', error);
      //     this.showToast('Failed to post comment', 'danger');
      //   }
      // });

      // Mock comment creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newComment: Comment = {
        id: Date.now().toString(),
        content: this.newComment.trim(),
        postId: this.topic.id.toString(),
        authorId: 1, // Current user ID
        parentId: null,
        isAnonymous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 1,
          name: 'Current User',
          email: 'user@example.com',
          profileImage: 'assets/images/nurse.png'
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
      await this.showToast('Comment posted successfully!', 'success');

    } catch (error) {
      console.error('Error posting comment:', error);
      await this.showToast('Failed to post comment. Please try again.', 'danger');
    } finally {
      this.isSubmittingComment = false;
    }
  }

  async likeComment(commentId: string) {
    // TODO: Implement like functionality
    // this.secretChatsService.toggleCommentLike(commentId).subscribe({
    //   next: (response) => {
    //     const comment = this.comments.find(c => c.id === commentId);
    //     if (comment) {
    //       comment.isLiked = response.liked;
    //       comment._count.likes += response.liked ? 1 : -1;
    //     }
    //   },
    //   error: (error) => {
    //     console.error('Error liking comment:', error);
    //   }
    // });

    // Mock like functionality
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
      target.src = 'assets/images/nurse.png';
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
}
