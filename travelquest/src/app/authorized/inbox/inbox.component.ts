import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';

interface Message {
  text: string;
  timestamp: any; // Firebase Timestamp or Date
  user: string;
  userId: string;
  conversationId: string;
}

interface Conversation {
  id: string;
  participants: string[];
}

@Component({
  selector: 'travelquest-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss'],
})
export class InboxComponent implements OnInit {
  currentUser: User | null = null; // Authenticated user
  conversations$!: Observable<Message[]>; // Observable for all aggregated messages
  userName: string = ''; // Store the current user's name
  loading: boolean = true; // Loading state
  error: string | null = null; // Error state

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get the authenticated user
    user(this.auth).subscribe((currentUser: User | null) => {
      this.currentUser = currentUser;

      if (this.currentUser) {
        this.userName = this.currentUser.displayName || 'User';
        this.fetchUserConversations();
      } else {
        this.error = 'You must log in to view your inbox.';
        this.loading = false;
      }
    });
  }

  // Fetch conversations for the authenticated user
  fetchUserConversations(): void {
    if (!this.currentUser) {
      console.error('Cannot fetch conversations: User is not authenticated.');
      this.error = 'You must log in to view your inbox.';
      this.loading = false;
      return;
    }

    const conversationsCollection = collection(this.firestore, 'conversations');
    const conversationsQuery = query(
      conversationsCollection,
      where('participants', 'array-contains', this.currentUser.uid),
      orderBy('timestamp', 'desc') // Fetch conversations sorted by recent activity
    );

    this.conversations$ = collectionData(conversationsQuery, {
      idField: 'id',
    }).pipe(
      map((conversations: Conversation[]) => {
        console.log('Conversations fetched:', conversations);

        return conversations.map((conversation) => {
          // Determine the other user's ID
          const otherUserId = conversation.participants.find(
            (participant) => participant !== this.currentUser!.uid
          );

          return {
            conversationId: conversation.id,
            userId: otherUserId || '',
            user: this.getUserName(otherUserId), // Fetch the user's name
            text: this.getLastMessage(conversation.id), // Fetch last message
            timestamp: new Date(), // Placeholder, replace with actual timestamp
          };
        });
      }),
      catchError((error) => {
        console.error('Error fetching conversations:', error);
        this.error = 'Failed to load inbox. Please try again later.';
        this.loading = false;
        return of([]);
      })
    );

    this.loading = false; // Stop the loading spinner after setting up the observable
  }

  // Redirect to a specific conversation
  openConversation(conversationId: string): void {
    if (!conversationId) {
      console.error('Conversation ID is missing.');
      return;
    }

    console.log('Navigating to conversation:', conversationId);
    this.router.navigate([`/conversation/${conversationId}`]).catch((err) => {
      console.error('Failed to navigate to the conversation:', err);
    });
  }

  // Fetch profile photo for a user or return a default
  getProfilePhoto(userId: string): string {
    // Replace this with Firestore logic if profile photos are stored in a collection
    return `assets/images/default-pic-green.png`;
  }

  // Placeholder for fetching the user's name
  getUserName(userId: string | undefined): string {
    // Implement logic to fetch user names from Firestore or return a placeholder
    return userId ? `User ${userId}` : 'Unknown User';
  }

  // Placeholder for fetching the last message of a conversation
  getLastMessage(conversationId: string): string {
    // Implement logic to fetch the last message from Firestore
    return 'Last message placeholder';
  }
}
