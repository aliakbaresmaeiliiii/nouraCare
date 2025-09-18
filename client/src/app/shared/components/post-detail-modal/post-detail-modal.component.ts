import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';

export interface PostComment {
  id: string;
  content: string;
  author: string;
  avatar?: string;
  createdAt: Date;
  isAnonymous?: boolean;
  likes: number;
  replies: PostReply[];
}

export interface PostReply {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  likes: number;
}

@Component({
  selector: 'app-post-detail-modal',
  templateUrl: './post-detail-modal.component.html',
  styleUrls: ['./post-detail-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PostDetailModalComponent implements OnInit {

  private modalController = inject(ModalController);
  private toastController = inject(ToastController);

  // Post data
  @Input() postData: any = null;
  
  // Filter options
  selectedFilter: 'top' | 'newest' | 'my' = 'top';
  
  // Comments
  comments: PostComment[] = [];
  newComment = '';
  newReply: { [commentId: string]: string } = {};
  
  // UI state
  isSubmittingComment = false;
  isSubmittingReply: { [commentId: string]: boolean } = {};

  ngOnInit() {
    // Initialize with sample comment like in the image
    this.comments = [
      {
        id: '1',
        content: 'This is a sample comment',
        author: 'Ali',
        createdAt: new Date(),
        likes: 0,
        replies: []
      }
    ];
  }

  // Filter methods
  selectFilter(filter: 'top' | 'newest' | 'my') {
    this.selectedFilter = filter;
    // TODO: Implement filtering logic
  }

  // Comment methods
  async submitComment() {
    if (!this.newComment.trim()) {
      await this.showToast('Please write a comment', 'warning');
      return;
    }

    this.isSubmittingComment = true;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const comment: PostComment = {
        id: Date.now().toString(),
        content: this.newComment.trim(),
        author: 'Anonymous User',
        createdAt: new Date(),
        isAnonymous: true,
        likes: 0,
        replies: []
      };

      this.comments.unshift(comment);
      this.newComment = '';
      
      await this.showToast('Comment posted successfully!', 'success');

    } catch (error) {
      console.error('Error posting comment:', error);
      await this.showToast('Failed to post comment. Please try again.', 'danger');
    } finally {
      this.isSubmittingComment = false;
    }
  }

  // Like comment
  async likeComment(commentId: string) {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      comment.likes++;
      await this.showToast('Liked!', 'success');
    }
  }

  // Submit reply
  async submitReply(commentId: string) {
    const replyText = this.newReply[commentId];
    if (!replyText?.trim()) {
      await this.showToast('Please write a reply', 'warning');
      return;
    }

    this.isSubmittingReply[commentId] = true;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const reply: PostReply = {
        id: Date.now().toString(),
        content: replyText.trim(),
        author: 'Anonymous User',
        createdAt: new Date(),
        likes: 0
      };

      const comment = this.comments.find(c => c.id === commentId);
      if (comment) {
        comment.replies.push(reply);
        this.newReply[commentId] = '';
      }
      
      await this.showToast('Reply posted successfully!', 'success');

    } catch (error) {
      console.error('Error posting reply:', error);
      await this.showToast('Failed to post reply. Please try again.', 'danger');
    } finally {
      this.isSubmittingReply[commentId] = false;
    }
  }

  // Like reply
  async likeReply(commentId: string, replyId: string) {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      const reply = comment.replies.find(r => r.id === replyId);
      if (reply) {
        reply.likes++;
        await this.showToast('Liked!', 'success');
      }
    }
  }

  // Modal actions
  async goBack() {
    await this.modalController.dismiss(null, 'back');
  }

  async openNotifications() {
    // TODO: Implement notifications
  }

  // Helper methods
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
