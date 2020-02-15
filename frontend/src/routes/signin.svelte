<style>
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

	async function handleSignin (e) {
		e.preventDefault();

		await fetch(`${process.env.API_URL}/sessions`, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify({ email, password }),
		});
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

	<button>Signin</button>
</form>
