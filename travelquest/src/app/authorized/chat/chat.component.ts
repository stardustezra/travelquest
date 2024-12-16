import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  collectionData,
} from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';
import { User } from 'firebase/auth';
import { Timestamp } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

interface Message {
  text: string;
  timestamp: Timestamp;
  user: string;
  userId: string;
}

interface Conversation {
  id: string;
  participants: string[];
  messages?: Message[];
}

@Component({
  selector: 'travelquest-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  messages$!: Observable<Message[]>; // Observable for conversation messages
  newMessage: string = ''; // Input for new messages
  currentUser: User | null = null; // Authenticated user
  currentConversationId: string | null = null; // Active conversation ID
  otherUserId: string = ''; // User ID of the other participant
  loadingMessages: boolean = true; // Loading state for messages

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Retrieve the other user's ID from the route
    this.route.paramMap.subscribe((params) => {
      this.otherUserId = params.get('userId') || '';
      console.log('Other user ID:', this.otherUserId);

      if (!this.otherUserId) {
        console.error('Other user ID is missing from the route.');
        return;
      }

      // Get the authenticated user
      user(this.auth).subscribe((currentUser: User | null) => {
        this.currentUser = currentUser;
        if (this.currentUser) {
          console.log('Current user:', this.currentUser.uid);
          this.checkExistingConversation(this.otherUserId);
        }
      });
    });
  }

  // Check if a conversation exists with the other user
  checkExistingConversation(otherParticipantUid: string): void {
    if (!this.currentUser) {
      console.error('Current user not found.');
      return;
    }

    const conversationsCollection = collection(this.firestore, 'conversations');
    const conversationsQuery = query(
      conversationsCollection,
      where('participants', 'array-contains', this.currentUser.uid)
    );

    collectionData(conversationsQuery, { idField: 'id' })
      .pipe(
        map((conversations: Conversation[]) =>
          conversations.find(
            (conversation) =>
              conversation.participants.length === 2 &&
              conversation.participants.includes(otherParticipantUid) &&
              conversation.participants.includes(this.currentUser!.uid)
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
            this.fetchMessages(existingConversation.id);
          } else {
            console.log(
              'No existing conversation found. Preparing to create a new one.'
            );
            this.currentConversationId = null;
            this.loadingMessages = false; // No messages to load
          }
        },
        (error: unknown) => {
          console.error('Error checking for existing conversation:', error);
          this.loadingMessages = false;
        }
      );
  }

  // Fetch messages for a conversation
  fetchMessages(conversationId: string): void {
    this.loadingMessages = true;

    const messagesCollection = collection(
      this.firestore,
      `conversations/${conversationId}/messages`
    );
    const messagesQuery = query(
      messagesCollection,
      orderBy('timestamp', 'asc')
    );

    this.messages$ = collectionData(messagesQuery, {
      idField: 'id',
    }) as Observable<Message[]>;

    this.messages$.subscribe(
      (messages: Message[]) => {
        console.log('Fetched messages:', messages);
        this.loadingMessages = false; // Stop loading once messages are fetched
      },
      (error: unknown) => {
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

    if (!this.currentUser) {
      console.error('User is not authenticated.');
      return;
    }

    if (!this.currentConversationId) {
      // Create a new conversation
      const conversationsCollection = collection(
        this.firestore,
        'conversations'
      );
      const newConversation = {
        participants: [this.currentUser.uid, this.otherUserId],
        timestamp: Timestamp.fromDate(new Date()),
      };

      addDoc(conversationsCollection, newConversation)
        .then((docRef) => {
          console.log('New conversation created with ID:', docRef.id);
          this.currentConversationId = docRef.id;
          this.sendMessageToFirestore(docRef.id); // Send the first message
        })
        .catch((error) => {
          console.error('Error creating new conversation:', error);
        });
    } else {
      // Add message to existing conversation
      this.sendMessageToFirestore(this.currentConversationId);
    }
  }

  private sendMessageToFirestore(conversationId: string): void {
    const messagesCollection = collection(
      this.firestore,
      `conversations/${conversationId}/messages`
    );

    const message: Message = {
      text: this.newMessage.trim(),
      timestamp: Timestamp.fromDate(new Date()),
      user: this.currentUser!.displayName || 'Anonymous',
      userId: this.currentUser!.uid,
    };

    addDoc(messagesCollection, message)
      .then(() => {
        console.log('Message sent successfully:', message);
        this.newMessage = ''; // Clear the input field
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  }
}
