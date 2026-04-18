/** One full-screen “story” slide inside a topic. */
export interface DailyInsightSlide {
  title: string;
  body: string;
}

/** A tappable home-card topic with its own story sequence. */
export interface DailyInsightTopic {
  id: string;
  categoryLabel: string;
  /** Short line on the outer card (inner box preview). */
  teaser: string;
  accentHex: string;
  ionIcon: string;
  slides: DailyInsightSlide[];
  /** Wider “for you” card with peach fill + magenta border. */
  personalized?: boolean;
}
