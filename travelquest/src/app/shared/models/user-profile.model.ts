export interface UserProfile {
  id: string; // GUID som string
  profilePic: string;
  name: string;
  age: number;
  country: string;
  language: string;
  travels: number | null;
  meetups: number | null;
  description: string | null;
}
