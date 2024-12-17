import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  collectionData,
  doc,
  getDoc,
} from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Observable, from } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { map, switchMap } from 'rxjs/operators';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';

interface Message {
  text: string;
  timestamp: Timestamp;
  user: string; // Will store the user name
  userId: string;
}

interface Conversation {
  id: string;
  participants: string[];
}

@Component({
  selector: 'travelquest-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  messages$!: Observable<Message[]>; // Observable for conversation messages
  newMessage: string = ''; // Input for new messages
  currentUserUID: string | null | undefined;
  currentConversationId: string | null = null; // Active conversation ID
  otherUserId: string | null = null; // User ID of the other participant
  loadingMessages: boolean = true; // Loading state for messages

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    private sessionStore: sessionStoreRepository
  ) {}

  ngOnInit(): void {
    this.loadAuthenticatedUser().then(() => {
      this.initializeComponent();
    });
  }

  private async loadAuthenticatedUser(): Promise<void> {
    this.currentUserUID = await this.sessionStore
      .getCurrentUserUID()
      .toPromise();
    if (!this.currentUserUID) {
      console.error('User is not authenticated.');
    } else {
      console.log('Authenticated user UID:', this.currentUserUID);
    }
  }

  private initializeComponent(): void {
    this.route.paramMap.subscribe((params) => {
      const conversationId = params.get('id'); // For `conversation/:id`
      const otherUserId = params.get('userId'); // For `chat/:userId`

      if (conversationId) {
        console.log('Loaded via conversation ID:', conversationId);
        this.currentConversationId = conversationId;
        this.fetchMessagesWithUserNames(conversationId);
      } else if (otherUserId) {
        console.log('Loaded via user ID:', otherUserId);
        this.otherUserId = otherUserId;
        this.checkExistingConversation(this.otherUserId);
      } else {
        console.error('Invalid route parameters. No conversation or user ID.');
      }
    });
  }

  // Check if a conversation exists with the other user
  private checkExistingConversation(otherParticipantUid: string): void {
    if (!this.currentUserUID) {
      console.error('Current user not found.');
      return;
    }

    const conversationsCollection = collection(this.firestore, 'conversations');
    const conversationsQuery = query(
      conversationsCollection,
      where('participants', 'array-contains', this.currentUserUID)
    );

    collectionData(conversationsQuery, { idField: 'id' })
      .pipe(
        map((conversations: Conversation[]) =>
          conversations.find(
            (conversation) =>
              conversation.participants.length === 2 &&
              conversation.participants.includes(otherParticipantUid) &&
              conversation.participants.includes(this.currentUserUID!)
          )
        )
      )
      .subscribe(
        (existingConversation: Conversation | undefined) => {
          if (existingConversation) {
            console.log(
              'Existing conversation found:',
              existingConversation.id
            );
            this.currentConversationId = existingConversation.id;
            this.fetchMessagesWithUserNames(existingConversation.id);
          } else {
            console.log('No existing conversation found. Creating a new one.');
            this.currentConversationId = null;
            this.loadingMessages = false;
          }
        },
        (error: unknown) => {
          console.error('Error checking for existing conversation:', error);
        }
      );
  }

  // Fetch messages and map userId to user name
  private fetchMessagesWithUserNames(conversationId: string): void {
    this.loadingMessages = true;

    const messagesCollection = collection(
      this.firestore,
      `conversations/${conversationId}/messages`
    );
    const messagesQuery = query(
      messagesCollection,
      orderBy('timestamp', 'asc')
    );

    this.messages$ = collectionData(messagesQuery, { idField: 'id' }).pipe(
      switchMap((messages: Message[]) =>
        from(
          Promise.all(
            messages.map(async (message) => {
              const userDocRef = doc(
                this.firestore,
                `publicProfiles/${message.userId}`
              );
              const userSnapshot = await getDoc(userDocRef);

              if (userSnapshot.exists()) {
                const userName =
                  userSnapshot.data()?.['name'] || 'Unknown User';
                return { ...message, user: userName };
              }
              return { ...message, user: 'Unknown User' };
            })
          )
        )
      )
    );

    this.messages$.subscribe(
      (messages: Message[]) => {
        console.log('Fetched messages with user names:', messages);
        this.loadingMessages = false;
      },
      (error) => {
        console.error('Error fetching messages:', error);
        this.loadingMessages = false;
      }
    );
  }

  // Send a new message
  sendMessage(): void {
    if (!this.newMessage.trim()) {
      console.error('Message is empty.');
      return;
    }

    if (!this.currentUserUID) {
      console.error('User is not authenticated.');
      return;
    }

    if (!this.currentConversationId) {
      this.createNewConversation();
    } else {
      this.sendMessageToFirestore(this.currentConversationId);
    }
  }

  private createNewConversation(): void {
    const conversationsCollection = collection(this.firestore, 'conversations');
    const newConversation = {
      participants: [this.currentUserUID, this.otherUserId || ''],
      timestamp: Timestamp.fromDate(new Date()),
    };

    addDoc(conversationsCollection, newConversation)
      .then((docRef) => {
        console.log('New conversation created with ID:', docRef.id);
        this.currentConversationId = docRef.id;
        this.sendMessageToFirestore(docRef.id);
      })
      .catch((error) => {
        console.error('Error creating new conversation:', error);
      });
  }

  private sendMessageToFirestore(conversationId: string): void {
    const messagesCollection = collection(
      this.firestore,
      `conversations/${conversationId}/messages`
    );

    const message: Message = {
      text: this.newMessage.trim(),
      timestamp: Timestamp.fromDate(new Date()),
      user: this.currentUserUID || 'Anonymous',
      userId: this.currentUserUID!,
    };

    addDoc(messagesCollection, message)
      .then(() => {
        console.log('Message sent successfully:', message);
        this.newMessage = '';
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  }
}
