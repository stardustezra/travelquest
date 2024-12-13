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
  conversations$!: Observable<Conversation[]>; // Observable for all conversations
  newMessage: string = ''; // Input for new messages
  currentUser: User | null = null; // Authenticated user
  currentConversationId: string | null = null; // Active conversation
  selectedOtherUserId: string | null = null; // Dynamically selected user for new conversation

  constructor(private firestore: Firestore, private auth: Auth) {}

  ngOnInit(): void {
    // Subscribe to the authenticated user
    user(this.auth).subscribe((currentUser: User | null) => {
      this.currentUser = currentUser;
      if (this.currentUser) {
        this.fetchConversations(); // Fetch conversations for the current user
      }
    });
  }

  // Fetch conversations for the current user
  fetchConversations(): void {
    const conversationsCollection = collection(this.firestore, 'conversations');
    const conversationsQuery = query(
      conversationsCollection,
      where('participants', 'array-contains', this.currentUser?.uid),
      orderBy('timestamp', 'desc')
    );

    this.conversations$ = collectionData(conversationsQuery, {
      idField: 'id',
    }).pipe(
      map((conversations: Conversation[]) => {
        // Filter duplicates based on participants
        const uniqueConversations = conversations.reduce(
          (acc, conversation) => {
            const existing = acc.find((conv) =>
              conv.participants.every((participant) =>
                conversation.participants.includes(participant)
              )
            );
            return existing ? acc : [...acc, conversation];
          },
          [] as Conversation[]
        );

        return uniqueConversations;
      })
    ) as Observable<Conversation[]>;
  }

  // Select an existing conversation
  selectConversation(conversationId: string): void {
    this.currentConversationId = conversationId;
    this.fetchMessages(conversationId); // Fetch messages for the selected conversation
  }

  // Fetch messages for a conversation
  fetchMessages(conversationId: string): void {
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
  }

  // Send a new message in the current conversation
  sendMessage(): void {
    if (
      this.newMessage.trim() &&
      this.currentUser &&
      this.currentConversationId
    ) {
      const message: Message = {
        text: this.newMessage,
        timestamp: Timestamp.fromDate(new Date()),
        user: this.currentUser.displayName || 'Anonymous',
        userId: this.currentUser.uid,
      };

      const messagesCollection = collection(
        this.firestore,
        `conversations/${this.currentConversationId}/messages`
      );
      addDoc(messagesCollection, message)
        .then(() => {
          this.newMessage = ''; // Clear input after sending
        })
        .catch((error) => {
          console.error('Error sending message:', error);
        });
    } else {
      console.error('Message, current user, or conversation ID missing.');
    }
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

    collectionData(conversationsQuery, { idField: 'id' }).subscribe(
      (conversations: Conversation[]) => {
        // Filter to find any existing conversation with the same participants
        const existingConversation = conversations.find(
          (conversation) =>
            conversation.participants.length === 2 && // Ensure it's a 1:1 chat
            conversation.participants.includes(otherParticipantUid) &&
            conversation.participants.includes(this.currentUser!.uid)
        );

        if (existingConversation) {
          console.log('Existing conversation found:', existingConversation.id);
          this.selectConversation(existingConversation.id); // Load existing conversation
        } else {
          console.log('No existing conversation found. Creating new one.');
          this.createConversation(otherParticipantUid); // Create a new conversation if none exists
        }
      }
    );
  }

  // Create a new conversation
  createConversation(otherParticipantUid: string): void {
    if (!this.currentUser) {
      console.error('Current user not authenticated.');
      return; // Exit early if no authenticated user
    }

    if (!otherParticipantUid) {
      console.error('Other participant UID is required.');
      return; // Exit early if no other participant UID is provided
    }

    const currentUserUid = this.currentUser.uid; // Use a local variable to avoid repeated null checks
    const conversationsCollection = collection(this.firestore, 'conversations');
    const conversationsQuery = query(
      conversationsCollection,
      where('participants', 'array-contains', currentUserUid)
    );

    collectionData(conversationsQuery, { idField: 'id' }).subscribe(
      (conversations: Conversation[]) => {
        // Check if a conversation with the same participants already exists
        const existingConversation = conversations.find(
          (conversation) =>
            conversation.participants.length === 2 && // Ensure it's a 1:1 conversation
            conversation.participants.includes(otherParticipantUid) &&
            conversation.participants.includes(currentUserUid)
        );

        if (existingConversation) {
          console.log('Existing conversation found:', existingConversation.id);
          this.selectConversation(existingConversation.id); // Load the existing conversation
        } else {
          console.log('No existing conversation found. Creating a new one.');
          const newConversation = {
            participants: [currentUserUid, otherParticipantUid],
            timestamp: Timestamp.fromDate(new Date()), // Add a timestamp for sorting
          };

          addDoc(conversationsCollection, newConversation)
            .then((docRef) => {
              console.log('Conversation created with ID:', docRef.id);
              this.selectConversation(docRef.id); // Automatically select the new conversation
            })
            .catch((error) => {
              console.error('Error creating conversation:', error);
            });
        }
      }
    );
  }

  // Dynamically select a user to start a conversation
  selectOtherUser(userId: string): void {
    this.selectedOtherUserId = userId;
    console.log('Selected other user ID:', userId);
    this.checkExistingConversation(userId); // Check for or create a conversation
  }
}
