import crypto from 'crypto';

describe('user flows', () => {
	const email = `alice.${
		crypto.randomBytes(8).toString('hex')
	}@example.com`;
	const testUrl = 'http://test-service/health?flakiness=0.90';

	it('signup -> add checkup -> view checkup -> signout', () => {
		cy.visit('/signup');
		cy.get('input[type="email"]').type(email);
		cy.get('input[type="password"]').type('password123');
		cy.contains('button', 'Signup').click();
		cy.url().should('include', '/checkups');

		cy.get('input[type="url"]').type(testUrl);
		cy.get('select').select('Every Minute');
		cy.get('button').contains('Create').click();

		cy.contains('div', testUrl).should('be', 'visible');

		cy.contains('a', 'View').click();
		cy.url().should('match', /\/checkups\/\d+/);

		cy.get('a').contains(email).click();
		cy.url().should('include', '/me');
		cy.contains('button', 'Signout').click();

		cy.url().should('match', /\/$/);
	});
});
