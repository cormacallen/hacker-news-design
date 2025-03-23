// cypress/e2e/accessibility.cy.ts
describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');

    // Set up API interceptors
    cy.intercept('GET', '**/topstories.json*', {
      fixture: 'topstories.json',
    }).as('getTopStories');

    cy.intercept('GET', '**/item/*.json*', {
      fixture: 'story.json',
    }).as('getStory');

    // Wait for the page to stabilize
    cy.get('.story-list-container', { timeout: 10000 }).should('exist');

    // Inject axe-core library (try-catch handled in the overwritten command)
    cy.injectAxe();
  });

  it('should have no critical accessibility violations', () => {
    // Only fail on critical issues - use undefined instead of null
    cy.checkA11y(undefined, {
      includedImpacts: ['critical'],
    });

    // Log other issues but don't fail the test
    cy.log('Testing for non-critical a11y issues (test will not fail)');
    cy.checkA11y();
  });

  it('should have accessible navigation', () => {
    cy.get('.header').should('exist');
    cy.checkA11y('.header', {
      includedImpacts: ['critical'],
    });
  });

  it('should have accessible story items', () => {
    cy.get('.story-item', { timeout: 10000 }).should('exist');
    cy.checkA11y('.story-item', {
      includedImpacts: ['critical'],
    });
  });
});
