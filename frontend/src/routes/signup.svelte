<style>
	h1, h2 {
		margin: 0 auto;
	}

	h1 {
		font-size: 2.8em;
		text-transform: uppercase;
		font-weight: 700;
		margin: 0 0 0.5em 0;
	}

	@media (min-width: 480px) {
		h1 {
			font-size: 4em;
		}
	}

	form {
		display: flex;
		flex-direction: column;
		max-width: 500px;
	}

	label {
		display: flex;
		justify-content: space-between;
		margin: 0.25rem;
	}

	input {
		max-width: 300px;
		width: 100%;
	}
</style>

<script>
	let email = '';
	let password = '';
	let verifyPassword = '';

	async function handleSignup (e) {
		e.preventDefault();

		await fetch(`${process.env.API_URL}/signup`, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify({ email, password }),
		});
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
		Password: <input type="password" bind:value={password} >
	</label>

	<label>
		Verify Password: <input type="password" bind:value={verifyPassword} >
	</label>

	<button>Signup</button>
</form>
