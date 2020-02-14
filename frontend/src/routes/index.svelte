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

	.ok {
		color: green;
	}
	.notOk {
		color: red;
	}
</style>

<script context="module">
	export async function preload ({ params, query }) {
		const res = await this.fetch(`${process.env.API_URL}/checkups`, {
			credentials: 'include',
		});
		const checkups = res.ok ? await res.json() : [];
		return { checkups };
	}
</script>

<script>
	let email = '';
	let password = '';
	let verifyPassword = '';

	const newCheckup = {
		url: '',
		crontab: '0 * * * *'
	};

	export let checkups;

	async function handleCreateCheckup (e) {
		e.preventDefault();

		await fetch(`${process.env.API_URL}/checkups`, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify(newCheckup),
		});
	}
</script>

<svelte:head>
	<title>Checkups</title>
</svelte:head>

<form on:submit={handleCreateCheckup}>
	<h2>New Checkup</h2>

	<label>
		URL: <input type="text" bind:value={newCheckup.url} >
	</label>

	<label>Interval:
		<select bind:value={newCheckup.crontab}>
			<option value="* * * * *">Every Minute</option>
			<option value="0 * * * *" selected>Hourly</option>
			<option value="0 0 * * *">Daily</option>
			<option value="0 0 * * 0">Weekly</option>
		</select>
	</label>

	<button>Create</button>
</form>

<section>
	<h2>Outbound Checkups</h2>

	{#each checkups as checkup, i}
		<div>
			{checkup.url} - {checkup.crontab}
			<div>
				{#each Array.from(checkup.recentStatuses).reverse() as status, i}
					<span
						class:ok="{status.status === 200}"
						class:notOk="{status.status !== 200}"
					>{status.status}&nbsp;</span>
				{/each}
			</div>
			<a href="/checkups/{checkup.id}">View</a>
		</div>
	{/each}

</section>
