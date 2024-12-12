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
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';
import { User } from 'firebase/auth'; // Import User type
import { Timestamp } from '@angular/fire/firestore';

interface Message {
  text: string;
  timestamp: Timestamp;
  user: string;
  userId: string;
}

interface Conversation {
  id: string; // Add this line to store the conversation document id
  participants: string[]; // Array of user IDs
  messages: Message[];
}

@Component({
  selector: 'travelquest-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  messages$!: Observable<Message[]>; // Use definite assignment operator
  conversations$!: Observable<Conversation[]>; // Observable for conversations
  newMessage: string = ''; // Text input for the new message
  currentUser: User | null = null; // To hold the current user, default to null
  currentConversationId: string | null = null; // The currently selected conversation

  constructor(private firestore: Firestore, private auth: Auth) {}

  ngOnInit(): void {
    // Subscribe to user changes to get the current authenticated user
    user(this.auth).subscribe((user: User | null) => {
      this.currentUser = user;
      if (this.currentUser) {
        this.fetchConversations(); // Fetch conversations when the user is authenticated
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
      idField: 'id', // Ensure the `id` field is included in the response
    }) as Observable<Conversation[]>;
  }

  // Method to select a conversation
  selectConversation(conversationId: string): void {
    this.currentConversationId = conversationId;
    this.fetchMessages(conversationId); // Fetch messages for the selected conversation
  }

  // Fetch messages for the selected conversation
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

  // Method to send a new message
  sendMessage(): void {
    if (
      this.newMessage.trim() &&
      this.currentUser &&
      this.currentConversationId
    ) {
      const message: Message = {
        text: this.newMessage, // The message text
        timestamp: Timestamp.fromDate(new Date()), // Convert the current date to Firestore timestamp
        user: this.currentUser.displayName || 'Anonymous', // Use displayName or 'Anonymous'
        userId: this.currentUser.uid, // User ID from Firebase Auth
      };

      const messagesCollection = collection(
        this.firestore,
        `conversations/${this.currentConversationId}/messages`
      );
      addDoc(messagesCollection, message)
        .then(() => {
          this.newMessage = ''; // Clear the input field after sending the message
        })
        .catch((error) => {
          console.error('Error sending message: ', error);
        });
    } else {
      console.log('No message to send');
    }
  }

  // Method to create a new conversation
  createConversation(): void {
    if (this.currentUser) {
      const newConversation = {
        participants: [this.currentUser.uid], // Create a new conversation with only the current user (for testing purposes)
        timestamp: Timestamp.fromDate(new Date()), // Add timestamp for sorting
      };
      const conversationsCollection = collection(
        this.firestore,
        'conversations'
      );
      addDoc(conversationsCollection, newConversation)
        .then((docRef) => {
          console.log('Conversation created with ID: ', docRef.id);
          this.selectConversation(docRef.id); // Automatically select the new conversation
        })
        .catch((error) => {
          console.error('Error creating conversation: ', error);
        });
    }
  }
}
