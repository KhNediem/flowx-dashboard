// cypress/e2e/view-sales-forecast.cy.ts

describe('Store Manager Views Sales Forecast Chart', () => {
  
    it('displays the sales forecast chart after selecting a product and generating graph', () => {
      // Visit the login page with redirect to home after login
    cy.visit('/login?redirectTo=%2F');

    // Fill in login form
    cy.get('input#email').type('testuser@company.com');     // Use a valid test user!
    cy.get('input#password').type('password123');           // Use the test user's password
    cy.get('button[type="submit"]').click();

    // Wait for redirect to dashboard/home
    cy.url().should('eq', 'http://localhost:3000/login?redirectTo=%2F');

    // Wait for tabs to render
    cy.get('button[role="tab"]', { timeout: 10000 }).should('exist');
    
    // Log tab texts for debug
    cy.get('button[role="tab"]').then($tabs => {
      const tabTexts = [...$tabs].map(tab => tab.innerText);
      cy.log('Tab texts:', JSON.stringify(tabTexts));
    });

    // 2. Click the "Sales Forecasting" tab
    cy.contains('button[role="tab"]', 'Sales Forecasting').click();

    // 3. Wait for the product dropdown to be enabled
    cy.get('[data-testid="product-select"]', { timeout: 10000 }).should('not.be.disabled');

    // 4. Open the product dropdown and select the first product
    cy.get('[data-testid="product-select"]').click();
    cy.get('[role="option"]').first().click();

    // 5. Click "Generate Graph"
    cy.get('button').contains('Generate Graph').click();

    // 6. Wait for the chart to appear
    cy.get('[data-testid="sales-forecast-chart"]', { timeout: 10000 }).should('exist');
    });
  });
  