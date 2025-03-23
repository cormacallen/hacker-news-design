describe('Hacker News App', () => {
  beforeEach(() => {
    // Set up interceptors for API calls to make tests deterministic
    cy.intercept(
      'GET',
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      {
        fixture: 'topstories.json',
      },
    ).as('getTopStories');

    cy.intercept('GET', 'https://hacker-news.firebaseio.com/v0/item/*.json', {
      fixture: 'story.json',
    }).as('getStory');

    cy.visit('/');
  });

  it('should display the header with logo', () => {
    cy.get('.logo').should('be.visible');
    cy.get('.logo-text').should('contain', 'Hacker');
  });

  it('should display story list', () => {
    cy.wait('@getTopStories');
    cy.wait('@getStory');
    cy.get('.story-item').should('exist');
  });

  it('should have theme toggle button', () => {
    cy.get('.theme-toggle').should('exist');
  });
});
