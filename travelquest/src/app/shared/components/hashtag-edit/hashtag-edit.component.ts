import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Hashtag {
  tag: string;
  category: string;
}

@Component({
  selector: 'travelquest-hashtag-edit',
  templateUrl: './hashtag-edit.component.html',
  styleUrls: ['./hashtag-edit.component.scss'],
})
export class HashtagEditComponent {
  @Input() predefinedHashtags: Hashtag[] = [];
  @Input() customHashtags: string[] = [];
  @Output() customHashtagsChange = new EventEmitter<string[]>();
  @Output() predefinedHashtagsChange = new EventEmitter<Hashtag[]>();

  // This is for the user to add custom hashtags
  separatorKeysCodes: number[] = [13, 188]; // Enter and Comma
  inputHashtag: string = '';

  // Method to add a custom hashtag
  addCustomHashtag(event: any): void {
    const value = event.value.trim();
    if (value && !this.customHashtags.includes(value)) {
      this.customHashtags.push(value);
      this.customHashtagsChange.emit(this.customHashtags);
    }
    this.inputHashtag = ''; // Clear input field after adding
  }

  // Method to remove a custom hashtag
  removeCustomHashtag(tag: string): void {
    const index = this.customHashtags.indexOf(tag);
    if (index >= 0) {
      this.customHashtags.splice(index, 1);
      this.customHashtagsChange.emit(this.customHashtags);
    }
  }

  // Method to update predefined hashtags selection
  updatePredefinedHashtags(event: any): void {
    const selectedHashtags = event.value; // event.value contains selected values
    this.predefinedHashtags = selectedHashtags.map((tag: string) => ({
      tag,
      category: 'General', // Update with actual category logic if needed
    }));
    this.predefinedHashtagsChange.emit(this.predefinedHashtags);
  }
}
