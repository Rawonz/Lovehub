export type Locale = 'en' | 'tr' | 'az';
export type Theme = 'light' | 'dark' | 'system';
export type Wallpaper = 'default' | 'sunset' | 'ocean' | 'blossom' | 'midnight' | 'forest';

export type CoupleStatus = 'active' | 'paused' | 'ended';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type TimelineCategory =
  | 'milestone'
  | 'trip'
  | 'date'
  | 'photo'
  | 'note'
  | 'other';
export type MediaType = 'image' | 'video';
export type LocationCategory =
  | 'special'
  | 'first_date'
  | 'trip'
  | 'restaurant'
  | 'home'
  | 'other';
export type DatePlanStatus = 'idea' | 'planned' | 'completed' | 'cancelled';
export type GiftRecipient = 'partner' | 'me';
export type GiftStatus = 'idea' | 'purchased' | 'given' | 'archived';
export type Recurrence = 'once' | 'yearly' | 'monthly';
export type AIRole = 'user' | 'assistant';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  locale: Locale;
  theme: Theme;
  partner_searching: boolean;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  id: string;
  user_id_1: string;
  user_id_2: string;
  anniversary_date: string | null;
  status: CoupleStatus;
  wallpaper: Wallpaper;
  created_at: string;
  updated_at: string;
}

export interface DailyTask {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  task_date: string;
  is_done: boolean;
  done_by: string | null;
  done_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoupleInvitation {
  id: string;
  code: string;
  inviter_id: string;
  invitee_id: string | null;
  couple_id: string | null;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  description: string | null;
  event_date: string;
  category: TimelineCategory;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  caption: string | null;
  media_url: string;
  media_type: MediaType;
  location: string | null;
  taken_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoveMapLocation {
  id: string;
  couple_id: string;
  author_id: string;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  category: LocationCategory;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatePlan {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  status: DatePlanStatus;
  location: string | null;
  budget_estimate: number | null;
  created_at: string;
  updated_at: string;
}

export interface GiftSuggestion {
  id: string;
  couple_id: string;
  author_id: string;
  recipient: GiftRecipient;
  name: string;
  description: string | null;
  occasion: string | null;
  budget_estimate: number | null;
  link_url: string | null;
  status: GiftStatus;
  created_at: string;
  updated_at: string;
}

export interface LoveQuiz {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizResult {
  id: string;
  couple_id: string;
  quiz_id: string;
  user_id: string;
  answers: Record<string, unknown>;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export interface Anniversary {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  description: string | null;
  anniversary_date: string;
  recurrence: Recurrence;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  couple_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: AIRole;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CoupleWithProfiles extends Couple {
  partner_1?: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'email'>;
  partner_2?: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'email'>;
}
