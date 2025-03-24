import { Routes } from '@angular/router';
import { StoryListComponent } from './components/story-list/story-list.component';

export const routes: Routes = [
  {
    path: '',
    component: StoryListComponent,
    title: 'Hacker News - Top Stories',
  },
  {
    path: 'stories/:type',
    component: StoryListComponent,
    title: 'Hacker News',
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
