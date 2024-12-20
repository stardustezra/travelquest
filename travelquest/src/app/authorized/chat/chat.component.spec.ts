import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';

// Mock ActivatedRoute
const mockRoute = {
  paramMap: of({
    get: (key: string) => (key === 'id' ? 'testConversationId' : null),
  }),
};

// Mock Firestore
const mockFirestore = jasmine.createSpyObj('Firestore', [
  'collection',
  'addDoc',
]);
mockFirestore.collection.and.returnValue({}); // Mock collection behavior
mockFirestore.addDoc.and.callFake(() => Promise.resolve()); // Mock addDoc success

// Mock sessionStoreRepository
const mockSessionStore = jasmine.createSpyObj('sessionStoreRepository', [
  'getCurrentUserUID',
]);
mockSessionStore.getCurrentUserUID.and.returnValue(of('testUserUID')); // Return a valid user UID

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Firestore, useValue: mockFirestore },
        { provide: sessionStoreRepository, useValue: mockSessionStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Trigger initial lifecycle hooks
  });

  beforeEach(() => {
    mockFirestore.collection.calls.reset();
    mockFirestore.addDoc.calls.reset();
  });

  it('should send a message successfully', async () => {
    // Arrange
    component.currentUserUID = 'testUserUID';
    component.currentConversationId = 'testConversationId';
    component.newMessage = 'Hello, World!';

    // Act
    await component.sendMessage();

    // Assert
    expect(mockFirestore.collection).toHaveBeenCalledWith(
      jasmine.anything(),
      `conversations/testConversationId/messages`
    );
    expect(mockFirestore.addDoc).toHaveBeenCalledWith(jasmine.anything(), {
      text: 'Hello, World!',
      timestamp: jasmine.any(Timestamp),
      user: 'testUserUID',
      userId: 'testUserUID',
    });
    expect(component.newMessage).toBe('');
  });

  it('should log an error if message is empty', () => {
    // Arrange
    component.newMessage = '   ';
    spyOn(console, 'error');

    // Act
    component.sendMessage();

    // Assert
    expect(console.error).toHaveBeenCalledWith('Message is empty.');
  });

  it('should not send a message if user is not authenticated', async () => {
    // Arrange
    component.currentUserUID = null;
    component.newMessage = 'Test message';
    spyOn(console, 'error');

    // Act
    await component.sendMessage();

    // Assert
    expect(console.error).toHaveBeenCalledWith('User is not authenticated.');
    expect(mockFirestore.addDoc).not.toHaveBeenCalled();
  });
});
