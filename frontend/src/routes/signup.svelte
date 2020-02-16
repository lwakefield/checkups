<style>
	.error {
		color: var(--red);
	}
</style>

<script>
	let email = '';
	let password = '';
	let error = null;

	async function handleSignup (e) {
		e.preventDefault();

		const signup = await fetch(`${process.env.API_URL}/signup`, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify({ email, password }),
		});

		if (signup.ok) {
			error = null;
			window.location = '/checkups';
			return;
		}

		error = 'Oops - something doesn\'t look right. Can you try again?';
	}
</script>

<svelte:head>
	<title>Signup</title>
</svelte:head>

<form on:submit={handleSignup}>
	<h2>Signup</h2>
	<label>
		Email: <input type="email" bind:value={email} >
	</label>

	<label>
		Password:
		<input type="password" bind:value={password} min=10 >
	</label>

	{#if error != null}
		<div class="error">{error}</div>
	{/if}

	<button>Signup</button>
</form>
