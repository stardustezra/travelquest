import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  collectionData,
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

@Component({
  selector: 'travelquest-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  messages$!: Observable<Message[]>; // Use definite assignment operator
  newMessage: string = ''; // Text input for the new message
  currentUser: User | null = null; // To hold the current user, default to null

  constructor(private firestore: Firestore, private auth: Auth) {}

  ngOnInit(): void {
    // Subscribe to user changes to get the current authenticated user
    user(this.auth).subscribe((user: User | null) => {
      // Explicitly type 'user' as User | null
      this.currentUser = user; // Set the current user to the authenticated user or null
    });

    // Firestore query to fetch messages ordered by timestamp
    const messagesCollection = collection(this.firestore, 'messages');
    const messagesQuery = query(
      messagesCollection,
      orderBy('timestamp', 'asc')
    );
    // Get messages as an observable
    this.messages$ = collectionData(messagesQuery, {
      idField: 'id',
    }) as Observable<Message[]>;
  }

  // Method to send a new message
  sendMessage(): void {
    // Ensure the message is not empty and the user is authenticated
    if (this.newMessage.trim() && this.currentUser) {
      const message: Message = {
        text: this.newMessage, // The message text
        timestamp: Timestamp.fromDate(new Date()), // Convert the current date to Firestore timestamp
        user: this.currentUser.displayName || 'Anonymous', // Use displayName or 'Anonymous'
        userId: this.currentUser.uid, // User ID from Firebase Auth
      };
      const messagesCollection = collection(this.firestore, 'messages');
      // Add the message to Firestore
      addDoc(messagesCollection, message);
      this.newMessage = ''; // Clear the input field after sending the message
    }
  }
}
