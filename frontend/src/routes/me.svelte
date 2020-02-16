<style>
	.error {
		color: var(--red);
	}
</style>

<script>
	import { stores } from '@sapper/app';
	const { session } = stores();

	const user = $session.user;

	const signout =      { error: null };
	const emailForm =    { email: user.email, password: '' };
	let emailError =     null;
	const passwordForm = { oldPassword: '', newPassword: '' };
	let passwordError =  null;

	async function handleSignout (e) {
		const signout = await fetch(`${process.env.API_URL}/sessions/me`, {
			method: 'DELETE',
			credentials: 'include',
		});

		if (signout.ok) {
			signout.error = null;
			window.location = '/';
			return;
		}

		signout.error = 'Oops - something went wrong. Can you try again?';
	}

	async function changeEmail (e) {
		e.preventDefault();

		const update = await fetch(`${process.env.API_URL}/users/${user.id}`, {
			method: 'PATCH',
			credentials: 'include',
			body: JSON.stringify(emailForm),
		});

		if (update.ok) {
			emailError = null;
			window.location = window.location;
			return;
		}

		emailError = 'Oops - something went wrong. Can you try again?';
	}

	async function changePassword (e) {
		e.preventDefault();

		const update = await fetch(`${process.env.API_URL}/users/${user.id}`, {
			method: 'PATCH',
			credentials: 'include',
			body: JSON.stringify({
				password: passwordForm.oldPassword,
				newPassword: passwordForm.newPassword
			}),
		});

		if (update.ok) {
			passwordError = null;
			window.location = window.location;
			return;
		}

		passwordError = 'Oops - something went wrong. Can you try again?';
	}
</script>

<svelte:head>
	<title>My Account</title>
</svelte:head>

<form on:submit={changeEmail}>
	<h2>Change Email</h2>
	<label>Email:    <input type="email" bind:value={emailForm.email} required />       </label>
	<label>Password: <input type="password" bind:value={emailForm.password} required /> </label>
	{#if emailError}
		<div class="error">{emailError}</div>
	{/if}
	<button>Change Email</button>
</form>

<br />

<form on:submit={changePassword}>
	<h2>Change Password</h2>
	<label>New Password: <input type="password" bind:value={passwordForm.newPassword} required /> </label>
	<label>Old Password: <input type="password" bind:value={passwordForm.oldPassword} required /> </label>
	{#if passwordError}
		<div class="error">{passwordError}</div>
	{/if}
	<button>Change Password</button>
</form>

<br />

<button on:click={handleSignout}>Signout</button>
