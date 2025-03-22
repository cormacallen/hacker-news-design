import { Routes } from '@angular/router';
import { StoryListComponent } from './components/story-list/story-list.component';

export const routes: Routes = [
  { path: '', component: StoryListComponent },
  { path: '**', redirectTo: '' },
];
