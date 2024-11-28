import { Component, Input } from '@angular/core';

interface Hashtag {
  tag: string;
  category: string;
}

@Component({
  selector: 'travelquest-hashtag-list',
  templateUrl: './hashtag-list.component.html',
  styleUrls: ['./hashtag-list.component.scss'],
})
export class HashtagListComponent {
  @Input() hashtags: Hashtag[] = [];

  categoryColors: { [key: string]: string } = {
    food: '#E7C933',
    culture: '#C852A2',
    activities: '#79D27F',
    sightseeing: '#5797EB',
    custom: '#8E77D2',
  };
}
