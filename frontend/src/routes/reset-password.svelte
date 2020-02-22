<style>
	.error {
		color: var(--red);
	}
	.success {
		color: var(--green);
	}
</style>

<script>
	import { stores } from '@sapper/app';
	const { page } = stores();

	const { token } = $page.query;

	let email = '';
	let password = '';
	let success = null;
	let error = null;

	async function handleResetPassword (e) {
		e.preventDefault();

		const session = await fetch(`${process.env.API_URL}/reset-password`, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify({ email }),
		});

		if (session.ok) {
			error = null;
			success = 'Please check your email for instructions on how to reset your password';
		} else {
			error = 'Something went wrong, please try again';
			success = null;
		}
	}

	async function handleSetPassword (e) {
		e.preventDefault();

		const session = await fetch(`${process.env.API_URL}/reset-password/me`, {
			method: 'PATCH',
			credentials: 'include',
			body: JSON.stringify({ password, token }),
		});

		if (session.ok) {
			error = null;
			success = 'Please check your email for instructions on how to reset your password';
		} else {
			error = 'Something went wrong, please try again';
			success = null;
		}
	}
</script>

<svelte:head>
	<title>Reset Password</title>
</svelte:head>

{#if token }
	<form on:submit={handleSetPassword}>
		<h2>Set a new password</h2>
		<label>
			New Password: <input type="password" bind:value={password} >
		</label>

		{#if success != null}
			<div class="success">{success}</div>
		{/if}

		{#if error != null}
			<div class="error">{error}</div>
		{/if}

		<button>Set new password</button>
	</form>
{:else }
		<form on:submit={handleResetPassword}>
		<h2>Reset Password</h2>
		<label>
			Email: <input type="email" bind:value={email} >
		</label>

		{#if success != null}
			<div class="success">{success}</div>
		{/if}

		{#if error != null}
			<div class="error">{error}</div>
		{/if}

		<button>Reset</button>
	</form>
{/if }
