import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  inject,
} from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';
import {
  AlertController,
  ToastController,
  ActionSheetController,
  ModalController,
} from '@ionic/angular';
import { SecretChatsService } from './services/secret-chat.service';
import { SecretChat, CreateSecretChatDto } from './secret.chats.dto';

// All data structures are now defined in secret.chats.dto.ts

@Component({
  selector: 'app-secret-chats',
  templateUrl: './secret-chats.html',
  styleUrls: ['./secret-chats.scss', './secret-chats-additional.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SecretChatsComponent implements OnInit {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);
  private secretChatsService = inject(SecretChatsService);

  // UI State
  unreadNotifications = 3;
  hasUserAvatar = false;
  isLoadingPosts = false;
  hasMorePosts = true;
  feedFilter: 'popular' | 'myposts' | 'following' | 'saved' = 'popular';
  activeTopic = 'pregnancy';

  // Data - all from API
  secretChats: any[] = [];
  filteredSecretChats: any[] = [];
  availableChats: SecretChat[] = [];
  selectedChatId: string = '';

  ngOnInit() {
    this.loadInitialData();
  }

  private loadInitialData() {
    // First get user's chats, then load posts
    this.getUserChats(1);
  }

  // Essential methods for the template
  openNotifications() {
    this.showToast('Opening notifications...', 'primary');
  }

  async createNewPost() {
    console.log('🆕 Opening create post modal...');

    // Check if user has access to create posts
    if (!this.canUserCreatePosts()) {
      this.showToast(
        'You need to be a member of a chat to create posts',
        'warning'
      );
      this.showNoChatsDialog();
      return;
    }

    const selectedChat = this.availableChats.find(
      (chat) => chat.id === this.selectedChatId
    );
    const userRole = this.getCurrentUserRole(selectedChat);

    console.log(
      '👤 Creating post as:',
      userRole,
      'in chat:',
      selectedChat?.name
    );

    const { CreatePostModalComponent } = await import(
      '../shared/components/create-post-modal/create-post-modal.component'
    );

    const modal = await this.modalController.create({
      component: CreatePostModalComponent,
      cssClass: 'create-post-modal-wrapper',
      backdropDismiss: false,
      componentProps: {
        selectedChatId: this.selectedChatId,
        selectedChatName: selectedChat?.name || 'Community Feed',
        availableChats: this.availableChats,
        currentUserRole: userRole,
      },
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'success' && data) {
      console.log('✅ Post creation confirmed:', data);

      // Add the new post to the feed
      this.addNewPostToFeed(data);
    }
  }

  getUserChats(page: number = 1) {
    this.secretChatsService.getUserChats().subscribe({
      next: (response: any) => {
        console.log('📋 User chats loaded:', response);

        // Extract chats from response.data
        const chats = response.data || response;

        if (chats && Array.isArray(chats) && chats.length > 0) {
          // Store available chats (only chats where user is a member)
          this.availableChats = chats;

          // Use the first chat's ID
          this.selectedChatId = chats[0].id;
          console.log('🎯 Selected chatId:', this.selectedChatId);
          console.log('📝 Chat name:', chats[0].name);
          console.log(
            '👥 User role in this chat:',
            chats[0].currentUserRole || 'MEMBER'
          );

          // Now load posts for this chat
          this.loadPosts(page);
        } else {
          console.warn('⚠️ No chats found for user');
          this.showNoChatsDialog();
        }
      },
      error: (error) => {
        console.error('❌ Failed to load user chats:', error);
        this.showToast('Failed to load chats', 'danger');
        this.showNoChatsDialog();
      },
    });
  }

  private addNewPostToFeed(postData: any) {
    console.log('✅ Post created successfully:', postData);
    this.showToast('Post created successfully! 🎉', 'success');

    // Reload posts from API to get the latest data
    this.loadPosts(1);
  }

  // Action methods - implement as needed
  startDiscussion() {
    this.showToast('Feature coming soon!', 'warning');
  }

  shareStory() {
    this.showToast('Feature coming soon!', 'warning');
  }

  findGroups() {
    this.showToast('Feature coming soon!', 'warning');
  }

  askExpert() {
    this.router.navigate(['/tabs/consultation']);
  }

  filterByTopic(topic: string) {
    this.activeTopic = topic;
    this.showToast(`Filtering by ${topic}`, 'primary');
  }

  setFilter(filter: 'popular' | 'myposts' | 'following' | 'saved') {
    this.feedFilter = filter;
    this.showToast(`Showing ${filter} posts`, 'primary');
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
      cssClass: 'ios-modern-toast',
    });
    await toast.present();
  }

  // Placeholder methods for template
  toggleLike(post: any, event: Event) {
    event.stopPropagation();
    
    // Optimistically update UI for better user experience
    const wasLiked = post.isLiked;
    post.isLiked = !wasLiked;
    post._count.likes = (post._count?.likes || 0) + (wasLiked ? -1 : 1);
    
    this.secretChatsService.togglePostLike(post.id).subscribe({
      next: (response: { liked: boolean }) => {
        console.log('✅ Like toggled:', response);
        
        // Update with actual server response
        post.isLiked = response.liked;
        
        // Adjust count based on actual server response
        if (response.liked !== !wasLiked) {
          post._count.likes = (post._count?.likes || 0) + (response.liked ? 1 : -1);
        }
      },
      error: (error) => {
        console.error('❌ Failed to toggle like:', error);
        
        // Revert optimistic update on error
        post.isLiked = wasLiked;
        post._count.likes = (post._count?.likes || 0) + (wasLiked ? 1 : -1);
        
        this.showToast('Failed to toggle like', 'danger');
      },
    });
  }

  openComments(post: any, event: Event) {
    event.stopPropagation();
    this.showToast('Opening comments...', 'primary');
  }

  bookmarkPost(post: any, event: Event) {
    event.stopPropagation();
    this.showToast('Bookmark toggled!', 'success');
  }

  voteOnPoll(post: any, index: number, event: Event) {
    event.stopPropagation();
    this.showToast('Vote recorded!', 'success');
  }

  openPost(post: any) {
    this.showToast('Opening post...', 'primary');
  }

  openPostMenu(post: any, event: Event) {
    event.stopPropagation();
    this.showToast('Opening menu...', 'primary');
  }

  viewImage(url: string, event: Event) {
    event.stopPropagation();
    this.showToast('Viewing image...', 'primary');
  }

  readFullStory(story: any) {
    this.showToast('Reading story...', 'primary');
  }

  likeStory(story: any) {
    this.showToast('Story liked!', 'success');
  }

  shareStoryExternal(story: any) {
    this.showToast('Feature coming soon!', 'warning');
  }

  loadMorePosts() {
    if (this.isLoadingPosts) return;

    this.isLoadingPosts = true;

    const currentCount = this.secretChats.length;
    const nextPage = Math.floor(currentCount / 20) + 1;

    // Don't reload chats, just load more posts
    this.secretChatsService
      .getChatPosts(this.selectedChatId, nextPage, 20)
      .subscribe({
        next: (response) => {
          const newPosts = response.data || response;
          if (Array.isArray(newPosts) && newPosts.length > 0) {
            this.secretChats = [...this.secretChats, ...newPosts];
            this.filteredSecretChats = [...this.secretChats];
            this.showToast(`${newPosts.length} more posts loaded`, 'success');
          } else {
            this.hasMorePosts = false;
            this.showToast('No more posts', 'warning');
          }

          this.isLoadingPosts = false;
        },
        error: (error) => {
          this.isLoadingPosts = false;
          this.showToast('Failed to load more posts', 'danger');
        },
      });
  }

  getTimeAgo(date: string | Date): string {
    if (!date) return 'Unknown';

    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return postDate.toLocaleDateString();
  }

  trackPost(index: number, post: any): string {
    return post.id || index.toString();
  }

  // Helper methods for template
  getAvatarClass(userId: any): string {
    const colors = ['purple', 'blue', 'pink', 'green', 'orange', 'red'];
    const index = userId ? String(userId).length % colors.length : 0;
    return colors[index];
  }

  getInitials(name: string | undefined): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  showPostMenu(post: any, event: Event) {
    event.stopPropagation();
    console.log('📋 Post menu for:', post.id);
    // TODO: Implement post menu (edit, delete, report, etc.)
  }

  showComments(post: any) {
    console.log('💬 Show comments for post:', post.id);
    // TODO: Navigate to comments view or open comments modal
  }

  sharePost(post: any) {
    post.stopPropagation();
    console.log('📤 Share post:', post.id);
    // TODO: Implement share functionality
    this.showToast('Share feature coming soon!', 'primary');
  }

  // Membership validation methods
  canUserCreatePosts(): boolean {
    return this.availableChats.length > 0 && this.selectedChatId !== '';
  }

  getCurrentUserRole(chat: any): string {
    // If the API already provides currentUserRole, use it
    if (chat?.currentUserRole) {
      return chat.currentUserRole;
    }

    // Fallback to checking members array
    if (!chat || !chat.members) {
      return 'NOT_MEMBER';
    }

    const currentUserId = this.getCurrentUserId();
    const membership = chat.members.find(
      (member: any) => member.userId === currentUserId
    );

    return membership ? membership.role : 'NOT_MEMBER';
  }

  private getCurrentUserId(): number {
    // TODO: Get actual user ID from your auth service
    // For now, return a placeholder
    return 1; // Replace with actual user ID
  }

  private async showNoChatsDialog() {
    const alert = await this.alertController.create({
      header: '🏠 No Chats Available',
      message:
        'You need to join or create a chat to start posting. Would you like to create a new chat?',
      cssClass: 'ios-modern-alert',
      buttons: [
        {
          text: 'Not Now',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Create Chat',
          cssClass: 'primary',
          handler: () => {
            this.createNewChat();
          },
        },
      ],
    });

    await alert.present();
  }

  private async createNewChat() {
    const alert = await this.alertController.create({
      header: '🆕 Create New Chat',
      cssClass: 'ios-modern-alert',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Chat name (e.g., "Pregnancy Support")',
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Brief description of this chat...',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Create',
          cssClass: 'primary',
          handler: (data) => {
            if (data.name && data.name.trim()) {
              this.submitNewChat(
                data.name.trim(),
                data.description?.trim() || ''
              );
              return true;
            } else {
              this.showToast('Please enter a chat name', 'warning');
              return false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private submitNewChat(name: string, description: string) {
    // Check authentication first
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.showToast('Please log in to create chats', 'danger');
      return;
    }

    const createChatDto: CreateSecretChatDto = {
      name,
      description,
      isGroup: true,
    };

    this.secretChatsService.createChat(createChatDto).subscribe({
      next: (newChat) => {
        this.showToast(`Chat "${name}" created successfully! 🎉`, 'success');

        // Add to available chats and select it
        this.availableChats.push(newChat);
        this.selectedChatId = newChat.id;

        // Load posts for the new chat
        this.loadPosts(1);
      },
      error: (error) => {
        if (error.status === 401) {
          this.showToast('Please log in to create chats', 'danger');
        } else if (error.status === 403) {
          this.showToast(
            'You do not have permission to create chats',
            'danger'
          );
        } else {
          this.showToast('Failed to create chat. Please try again.', 'danger');
        }
      },
    });
  }

  private loadPosts(page: number = 1) {
    if (!this.selectedChatId) {
      this.showToast('No chat selected', 'danger');
      return;
    }

    this.isLoadingPosts = true;

    // از API پست‌ها رو بخون
    this.secretChatsService
      .getChatPosts(this.selectedChatId, page, 20)
      .subscribe({
        next: (response) => {
          // اگر response.data داره، اونو استفاده کن
          const posts = response.data || response;
          // Ensure each post has the required properties for UI
          this.secretChats = Array.isArray(posts) ? posts.map(post => ({
            ...post,
            isLiked: post.isLiked || false,
            // Ensure _count object exists with proper defaults
            _count: {
              ...post._count, // spread existing _count properties first
              likes: (post._count?.likes ?? 0), // then ensure likes has proper default
              comments: (post._count?.comments ?? 0) // then ensure comments has proper default
            }
          })) : [];
          this.filteredSecretChats = [...this.secretChats];

          this.isLoadingPosts = false;
          this.showToast(`${this.secretChats.length} posts loaded`, 'success');
        },
        error: (error) => {
          this.isLoadingPosts = false;

          // اگر API کار نکرد، پست‌های تست نشون بده
          this.secretChats = [];
          this.filteredSecretChats = [];
          this.showToast('Failed to load posts', 'danger');
        },
      });
  }
}
