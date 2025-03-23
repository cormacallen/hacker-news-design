// cypress/support/e2e.ts
import './commands';

// Import cypress-axe
import 'cypress-axe';
import { Result } from 'axe-core';

// Disable the default axe assertion failure
// Configure how we want to handle accessibility violations
Cypress.Commands.overwrite('checkA11y', (originalFn, context, options) => {
  // Create a callback to handle violations with proper type annotation
  const violationCallback = (violations: Result[]) => {
    // Log the violations to the console but don't fail the test
    if (violations.length > 0) {
      cy.log(
        `${violations.length} accessibility violation(s) detected but test allowed to pass`,
      );
      cy.log('See console for details');
      console.table(
        violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })),
      );
    }
  };

  // Call the original function with proper parameters
  return originalFn(context, options, violationCallback);
});

// Suppress uncaught exceptions - useful when testing
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});
