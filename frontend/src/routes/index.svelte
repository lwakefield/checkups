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

	const newCheckup = {
		url: '',
		crontab: '0 * * * *'
	};

	async function handleSignup (e) {
		e.preventDefault();

		await fetch(`${process.env.API_URL}/signup`, {
			method: 'POST',
			mode: 'cors',
			credentials: 'include',
			body: JSON.stringify({ email, password }),
		});
	}

	async function handleSignin (e) {
		e.preventDefault();

		await fetch(`${process.env.API_URL}/sessions`, {
			method: 'POST',
			mode: 'cors',
			credentials: 'include',
			body: JSON.stringify({ email, password }),
		});
	}

	async function handleCreateCheckup (e) {
		e.preventDefault();

		await fetch(`${process.env.API_URL}/checkups`, {
			method: 'POST',
			mode: 'cors',
			credentials: 'include',
			body: JSON.stringify(newCheckup),
		});
	}
</script>

<svelte:head>
	<title>checkups</title>
</svelte:head>

<h1>Checkups</h1>

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

<form on:submit={handleCreateCheckup}>
	<h2>New Checkup</h2>

	<label>
		URL: <input type="text" bind:value={newCheckup.url} >
	</label>

	<label>Interval:
		<select bind:value={newCheckup.crontab}>
			<option value="0 * * * *">Hourly</option>
			<option value="0 0 * * *">Daily</option>
			<option value="0 0 * * 0">Weekly</option>
		</select>
	</label>

	<button>Create</button>
</form>
