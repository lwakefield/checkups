<style>
	.error {
		color: var(--red);
	}
</style>

<script>
	let email = '';
	let password = '';
	let error = null;

	async function handleSignin (e) {
		e.preventDefault();

		const session = await fetch(`${process.env.API_URL}/sessions`, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify({ email, password }),
		});

		if (session.ok) {
			error = null;
			window.location = '/checkups';
			return;
		}

		error = 'Oops - something doesn\'t look right. Can you try again?';
	}
</script>

<svelte:head>
	<title>Signin</title>
</svelte:head>

<form on:submit={handleSignin}>
	<h2>Signin</h2>
	<label>
		Email: <input type="email" bind:value={email} >
	</label>

	<label>
		Password: <input type="password" bind:value={password} >
	</label>

	{#if error != null}
		<div class="error">{error}</div>
	{/if}

	<button>Signin</button>

	<a href="/reset-password">Forgot your password?</a>
</form>
