import { Routes } from '@angular/router';
import { ListComponent } from './components/scores/list/list.component';
import { DetailsComponent } from './components/scores/details/details.component';
import { ListCategoriesComponent } from '@components/categories/list-categories/list-categories.component';
import { CategoryDetailsComponent } from '@components/categories/category-details/category-details.component';
import { DownloadComponent } from '@components/download/download.component';
import { AboutComponent } from '@components/about/about.component';
import { NotFoundComponent } from '@components/not-found/not-found.component';

export const startPage = Object.freeze({
    title: 'Home',
    url: '/',
});

export const menuItems = Object.freeze([
    { title: startPage.title, url: startPage.url },
    { title: 'Advanced Search', url: '/scores' },
    { title: 'Download', url: '/download' },
    { title: 'About', url: '/about' },
  ]);

export const routes: Routes = [
    { path: '', title: 'Jamictionary', component: ListCategoriesComponent, pathMatch: 'full' },
    { path: 'scores', title: 'All scores — Jamictionary', component: ListComponent },
    { path: 'scores/:number', title: 'Score details — Jamictionary', component: DetailsComponent },
    { path: 'categories', title: 'Categories — Jamictionary', component: ListCategoriesComponent },
    { path: 'categories/:name', title: 'Scores for a category — Jamictionary', component: CategoryDetailsComponent },
    { path: 'download', title: 'Download — Jamictionary', component: DownloadComponent },
    { path: 'about', title: 'About — Jamictionary', component: AboutComponent },
    // Handle any broken paths.
    { path: '**', title: '404 — Not Found — Jamictionary', component: NotFoundComponent },
];
