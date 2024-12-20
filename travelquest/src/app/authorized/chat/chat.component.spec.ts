import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { Firestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Mock Firestore
const mockFirestore = {
  collection: jasmine.createSpy('collection').and.callFake(() => ({
    addDoc: jasmine.createSpy('addDoc').and.returnValue(Promise.resolve()),
  })),
};

// Mock ActivatedRoute
const mockActivatedRoute = {
  paramMap: of({
    get: (key: string) => (key === 'id' ? 'conversation123' : null),
  }),
};

// Mock sessionStoreRepository
const mockSessionStore = {
  getCurrentUserUID: jasmine
    .createSpy('getCurrentUserUID')
    .and.returnValue(of('mockUserUID')),
};

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatComponent],
      imports: [FormsModule],
      providers: [
        { provide: Firestore, useValue: mockFirestore },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: sessionStoreRepository, useValue: mockSessionStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should send a message successfully', async () => {
    // Mock conversation ID and user authentication
    component.currentConversationId = 'conversation123';
    component.currentUserUID = 'mockUserUID';

    // Set the new message input
    component.newMessage = 'Hello, World!';

    // Spy on the Firestore addDoc method
    const messagesCollectionSpy = mockFirestore.collection;
    const addDocSpy = messagesCollectionSpy().addDoc;

    // Call sendMessage method
    component.sendMessage();

    // Verify that addDoc was called with correct arguments
    expect(messagesCollectionSpy).toHaveBeenCalledWith(
      'conversations/conversation123/messages'
    );
    expect(addDocSpy).toHaveBeenCalledWith({
      text: 'Hello, World!',
      timestamp: jasmine.any(Object), // Timestamp will be mocked
      user: 'mockUserUID',
      userId: 'mockUserUID',
    });

    // Ensure the newMessage is reset
    expect(component.newMessage).toBe('');
  });
});
