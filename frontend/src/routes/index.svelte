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

	.ok {
		color: var(--green);
	}
	.notOk {
		color: var(--red);
	}

	.checkup {
		border-bottom: 1px solid var(--gray);
		padding: 1rem 0;
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

<h2>Outbound Checkups</h2>

<form on:submit={handleCreateCheckup}>
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
	{#each checkups as checkup, i}
		<div class="checkup">
			<div>{checkup.url}</div>
			<div>
				<span>{checkup.crontab}</span>
				-
				{#each Array.from(checkup.recentStatuses).reverse() as status, i}
					<span
						class:ok="{status.status === 200}"
						class:notOk="{status.status !== 200}"
					>{status.status}</span>
				{/each}-
				<a href="/checkups/{checkup.id}">View</a>
			</div>
		</div>
	{/each}

</section>
