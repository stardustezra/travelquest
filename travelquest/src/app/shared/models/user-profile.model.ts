// Directly in profile-list.component.ts (less recommended)

export interface Hashtag {
  tag: string;
  category: string;
}

export interface UserProfile {
  name: string;
  age: number;
  country: string;
  languages: string[];
  hashtags: Hashtag[];
  bio: string;
  travels: string;
  meetups: string;
}
