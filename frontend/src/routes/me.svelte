<style>
</style>

<script>
	const signout = { error: null };

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
</script>

<svelte:head>
	<title>My Account</title>
</svelte:head>

<h1>My Account</h1>

<button on:click={handleSignout}>Signout</button>
