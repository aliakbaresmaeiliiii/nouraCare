import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { Router } from '@angular/router';
import { AlertController, ToastController, ActionSheetController, ModalController } from '@ionic/angular';

interface Post {
  id: string;
  username: string;
  userAvatar: string;
  content: string;
  image?: string;
  createdAt: Date;
  likes: number;
  comments: number;
  shares?: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isFeatured?: boolean;
  isOnline?: boolean;
  category?: string;
  poll?: {
    question: string;
    options: Array<{text: string, percentage: number, votes: number}>;
    totalVotes: number;
    userVote?: number;
  };
  recentComments?: Array<{username: string, text: string}>;
}

interface FeaturedStory {
  id: string;
  author: string;
  avatar: string;
  journey: string;
  excerpt: string;
  likes: number;
  comments: number;
}

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss'],
  standalone: true,
  imports: [SharedModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SocialComponent implements OnInit {
  
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);

  // UI State
  unreadNotifications = 3;
  hasUserAvatar = false;
  isLoadingPosts = false;
  hasMorePosts = true;
  feedFilter: 'popular' | 'myposts' | 'following' | 'saved' = 'popular';
  activeTopic = 'pregnancy';

  // Data
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  featuredStory: FeaturedStory | null = null;

  ngOnInit() {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.loadFeaturedStory();
    this.loadPosts();
  }

  private loadFeaturedStory() {
    this.featuredStory = {
      id: '1',
      author: 'Maria Santos',
      avatar: 'assets/images/user-maria.png',
      journey: '2 years trying • Now 32 weeks pregnant',
      excerpt: 'After 2 years of trying and tracking my cycle with this app, I finally got my BFP! The community support was incredible throughout my journey...',
      likes: 234,
      comments: 67
    };
  }

  // Essential methods for the template
  openNotifications() {
    this.showToast('Opening notifications...', 'primary');
  }

  async createNewPost() {
    const { CreatePostModalComponent } = await import('../shared/components/create-post-modal/create-post-modal.component');
    
    const modal = await this.modalController.create({
      component: CreatePostModalComponent,
      cssClass: 'create-post-modal-wrapper',
      backdropDismiss: false
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'success' && data) {
      // Add the new post to the feed
      this.addNewPostToFeed(data);
    }
  }

  private addNewPostToFeed(postData: any) {
    const newPost = {
      id: Date.now().toString(),
      username: 'You',
      userAvatar: 'assets/images/user-avatar.png',
      content: postData.content,
      image: postData.images && postData.images.length > 0 ? URL.createObjectURL(postData.images[0]) : undefined,
      createdAt: new Date(),
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isBookmarked: false,
      isFeatured: false,
      isOnline: true,
      category: 'General'
    };

    // Add to the beginning of the posts array
    this.posts.unshift(newPost);
    this.filteredPosts.unshift(newPost);
    
    this.showToast('Post created successfully! 🎉', 'success');
  }

  startDiscussion() {
    this.showToast('Starting discussion...', 'primary');
  }

  shareStory() {
    this.showToast('Sharing story...', 'success');
  }

  findGroups() {
    this.showToast('Finding groups...', 'primary');
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
      position: 'bottom'
    });
    await toast.present();
  }

  // Placeholder methods for template
  toggleLike(post: any, event: Event) {
    event.stopPropagation();
    this.showToast('Like toggled!', 'success');
  }

  openComments(post: any, event: Event) {
    event.stopPropagation();
    this.showToast('Opening comments...', 'primary');
  }

  sharePost(post: any, event: Event) {
    event.stopPropagation();
    this.showToast('Sharing post...', 'primary');
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
    this.showToast('Sharing story...', 'primary');
  }

  loadMorePosts() {
    this.showToast('Loading more posts...', 'primary');
  }

  getTimeAgo(date: Date): string {
    return '2h ago'; // Placeholder
  }

  trackPost(index: number, post: any): string {
    return post.id || index.toString();
  }

  private loadPosts() {
    this.isLoadingPosts = true;
    setTimeout(() => {
      this.posts = [
        {
          id: '1',
          username: 'Sarah M.',
          userAvatar: 'assets/images/user-sarah.png',
          content: 'Just found out I\'m expecting! 🎉 Any first-time moms want to connect?',
          createdAt: new Date(),
          likes: 24,
          comments: 8,
          shares: 3,
          isLiked: false,
          isBookmarked: false,
          isFeatured: true,
          isOnline: true,
          category: 'Pregnancy'
        }
      ];
      this.filteredPosts = [...this.posts];
      this.isLoadingPosts = false;
    }, 1000);
  }
}
