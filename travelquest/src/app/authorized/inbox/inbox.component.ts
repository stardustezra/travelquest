import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  limit,
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { combineLatestWith, Observable, of, catchError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router'; // Import Router
import { User } from 'firebase/auth';
import { Timestamp } from '@angular/fire/firestore';

interface Message {
  text: string;
  timestamp: Timestamp;
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
  userName: string = ''; // Store the current user's name
  messages$!: Observable<Message[]>; // Observable for all aggregated messages
  currentUser: User | null = null; // Hold the current user

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router // Inject Router for navigation
  ) {}

  ngOnInit(): void {
    // Get the current authenticated user
    user(this.auth).subscribe((currentUser: User | null) => {
      this.currentUser = currentUser;
      this.userName = currentUser?.displayName || 'User';
      if (this.currentUser) {
        this.fetchInboxMessages();
      }
    });
  }

  // Fetch all messages for the current user's inbox
  fetchInboxMessages(): void {
    const conversationsCollection = collection(this.firestore, 'conversations');
    const conversationsQuery = query(
      conversationsCollection,
      where('participants', 'array-contains', this.currentUser?.uid)
    );

    const conversations$ = collectionData(conversationsQuery, {
      idField: 'id',
    }) as Observable<Conversation[]>;

    this.messages$ = conversations$.pipe(
      switchMap((conversations) => {
        console.log('Conversations fetched:', conversations); // Debugging log for conversations

        if (conversations.length === 0) {
          console.log('No conversations found for the current user.');
          return of([]); // Return an empty array if no conversations exist
        }

        // Create an observable for fetching the latest message for each conversation
        const latestMessageObservables = conversations.map((conversation) => {
          const messagesCollection = collection(
            this.firestore,
            `conversations/${conversation.id}/messages`
          );
          const latestMessageQuery = query(
            messagesCollection,
            orderBy('timestamp', 'desc'),
            limit(1) // Fetch only the latest message
          );

          return collectionData(latestMessageQuery, {
            idField: 'conversationId',
          }).pipe(
            map((messages: Message[]) => {
              if (messages.length === 0) {
                console.warn(
                  `No messages found for conversation ${conversation.id}`
                );
                return null; // Return null if no messages are found
              }
              return {
                ...messages[0], // Only the latest message
                conversationId: conversation.id, // Add the conversation ID for navigation
              };
            }),
            catchError((error) => {
              console.error(
                `Error fetching messages for conversation ${conversation.id}:`,
                error
              );
              return of(null); // Gracefully handle errors
            })
          );
        });

        // Use `combineLatestWith` to combine all observables
        const combinedMessages$ = of(...latestMessageObservables).pipe(
          combineLatestWith(...latestMessageObservables),
          map((latestMessages) => {
            const filteredMessages = latestMessages.filter(
              (msg) => msg !== null
            );
            console.log('Latest messages:', filteredMessages); // Debugging log for latest messages
            return filteredMessages;
          })
        );

        return combinedMessages$;
      })
    );
  }

  // Redirect to a specific conversation
  openConversation(conversationId: string): void {
    if (!conversationId) {
      console.error('Conversation ID is undefined or empty'); // Add error log
      return;
    }
    console.log('Redirecting to conversation:', conversationId); // Debugging log
    this.router
      .navigate(['/conversation', conversationId])
      .then((navigated) => {
        if (navigated) {
          console.log('Navigation to conversation was successful.');
        } else {
          console.error('Navigation to conversation failed.');
        }
      });
  }

  // Fetch profile photo for a user or return a default
  getProfilePhoto(userId: string): string {
    // Replace this with Firestore logic if profile photos are stored in a separate collection
    return `assets/images/default-pic-green.png`;
  }
}
