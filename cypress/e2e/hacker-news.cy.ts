// cypress/e2e/hacker-news.cy.ts
import 'cypress-axe';

describe('Hacker News App', () => {
  beforeEach(() => {
    cy.visit('/');

    // Intercept API calls to make tests more predictable
    cy.intercept(
      'GET',
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      {
        fixture: 'topstories.json',
      },
    ).as('getTopStories');

    // Intercept individual story requests
    cy.intercept('GET', 'https://hacker-news.firebaseio.com/v0/item/*.json', {
      fixture: 'story.json',
    }).as('getStory');
  });

  it('should display the header with logo', () => {
    cy.get('.logo').should('be.visible');
    cy.get('.logo-text').should('contain', 'Hacker');
  });

  it('should display story list', () => {
    cy.wait('@getTopStories');
    cy.wait('@getStory');
    cy.get('.story-item').should('have.length.greaterThan', 0);
  });

  it('should switch between tabs', () => {
    cy.intercept(
      'GET',
      'https://hacker-news.firebaseio.com/v0/newstories.json',
      {
        fixture: 'newstories.json',
      },
    ).as('getNewStories');

    cy.get('.tab').contains('New').click();
    cy.wait('@getNewStories');
    cy.get('.tab.active').should('contain', 'New');
    cy.url().should('include', '/stories/new');
  });

  it('should toggle between light and dark mode', () => {
    // Initially in system/light mode
    cy.get('html').should('not.have.class', 'dark-theme');

    // Click theme toggle
    cy.get('.theme-toggle').click();

    // Should now be in dark mode
    cy.get('html').should('have.class', 'dark-theme');
  });

  it('should show story details', () => {
    cy.wait('@getTopStories');
    cy.wait('@getStory');

    cy.get('.story-title a').first().should('be.visible');
    cy.get('.story-meta').first().should('contain', 'points');
    cy.get('.story-meta').first().should('contain', 'comments');
  });

  it('should be accessible', () => {
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should search for stories', () => {
    cy.get('.search-input').type('angular');
    cy.get('.search-button').click();

    // Add your assertions for search functionality
    cy.get('.search-input').should('have.value', 'angular');
  });

  it('should load more stories', () => {
    cy.wait('@getTopStories');
    cy.wait('@getStory');

    const initialStoryCount = cy.get('.story-item').its('length');

    cy.get('.load-more-button').click();
    cy.wait('@getTopStories');

    cy.get('.story-item').its('length').should('be.gt', initialStoryCount);
  });
});
