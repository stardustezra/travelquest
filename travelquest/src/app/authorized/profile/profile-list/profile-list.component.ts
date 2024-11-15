import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'travelquest-profile-list',
  templateUrl: './profile-list.component.html',
  styleUrls: ['./profile-list.component.scss'],
})
export class ProfileListComponent implements OnInit {
  userProfile: any;

  constructor(private authService: AuthService) {
    // Default profile data, can be overwritten by data from the service
    this.userProfile = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      profilePic: 'https://www.example.com/path/to/profile-pic.jpg',
      name: 'John Doe',
      age: 30,
      country: 'USA',
      language: 'English',
      travels: 5,
      meetups: 3,
      description:
        'I love traveling and meeting new people! I love traveling and meeting new people! I love traveling and meeting new people! ',
    };
  }

  ngOnInit(): void {
    // Fetch the signed-in user's profile data when the component initializes
    this.authService.getSignedInUserProfile().subscribe((profile) => {
      if (profile) {
        this.userProfile = profile;
      }
    });
  }
}
