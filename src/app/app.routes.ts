import { Routes } from '@angular/router';
import { StoryListComponent } from './components/story-list/story-list.component';

export const routes: Routes = [
  {
    path: '',
    component: StoryListComponent,
    title: 'Hacker News Redesigned - Top Stories',
  },
  {
    path: 'stories/:type',
    component: StoryListComponent,
    title: 'Hacker News Redesigned',
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
