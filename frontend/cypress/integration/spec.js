import crypto from 'crypto';

describe('user flows', () => {
	const email = `alice.${
		crypto.randomBytes(8).toString('hex')
	}@example.com`;
	const password = 'password123';
	const testUrl = 'http://test-service/health?flakiness=0.90';

	it('signup -> add checkup -> view checkup -> signout', () => {
		// Signup
		cy.visit('/signup');
		cy.get('input[type="email"]').type(email);
		cy.get('input[type="password"]').type(password);
		cy.contains('button', 'Signup').click();
		cy.url().should('include', '/checkups');

		// Add checkup
		cy.get('input[type="url"]').type(testUrl);
		cy.get('select').select('Every Minute');
		cy.get('button').contains('Create').click();
		cy.contains('div', testUrl).should('be', 'visible');

		// View checkup
		cy.contains('a', 'View').click();
		cy.url().should('match', /\/checkups\/\d+/);

		// Signout
		const signout = () => {
			cy.get('a').contains(email).click();
			cy.url().should('include', '/me');
			cy.contains('button', 'Signout').click();
			cy.url().should('match', /\/$/);
		};
		signout();

		// Signin
		cy.contains('a', 'signin').click();
		cy.url().should('include', '/signin');
		cy.get('input[type="email"]').type(email);
		cy.get('input[type="password"]').type(password);
		cy.contains('button', 'Signin').click();
		cy.url().should('include', '/checkups');

		// Signout
		signout();

		// Reset password
		cy.contains('a', 'signin').click();
		cy.url().should('include', '/signin');
		cy.contains('a', 'Forgot your password').click();
		cy.url().should('include', '/reset-password');
		cy.get('input[type="email"]').type(email);
		cy.contains('button', 'Reset').click();
	});
});
