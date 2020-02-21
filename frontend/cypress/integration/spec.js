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
		cy.get('button').contains('Signup').click();
		cy.url().should('include', '/checkups');

		cy.get('input[type="url"]').type(testUrl);
		cy.get('select').select('Every Minute');
		cy.get('button').contains('Create').click();

		cy.reload();

		cy.get('div').contains(testUrl).should('be', 'visible');

		cy.get('a').contains('View').click();
		cy.url().should('match', /\/checkups\/\d+/);

		cy.get('a').contains(email).click();
		cy.url().should('include', '/me');
		cy.get('h2').should('contain', 'Change Email');
		cy.get('button').contains('Signout').click();

		cy.url().should('match', /\/$/);
	});
});
