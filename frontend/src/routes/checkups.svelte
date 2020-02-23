<style>
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

	section {
		margin-bottom: 1rem;
	}
</style>

<script context="module">
	export async function preload (page, session) {
		if (session.user === null) {
			return this.redirect(302, '/signin')
		}

		const outbound = await this.fetch(`${process.env.API_URL}/checkups?type=outbound`, {
			credentials: 'include',
		});
		const inbound = await this.fetch(`${process.env.API_URL}/checkups?type=inbound`, {
			credentials: 'include',
		});
		return {
			outboundCheckups: outbound.ok ? await outbound.json() : [],
			inboundCheckups:  inbound.ok  ? await inbound.json()  : [],
		};
	}
</script>

<script>
	let email = '';
	let password = '';
	let verifyPassword = '';

	const newOutboundCheckup = {
		url: '',
		crontab: '0 * * * *',
		type: 'outbound',
	};

	const newInboundCheckup = {
		description: '',
		crontab: '0 * * * *',
		type: 'inbound',
	};

	export let outboundCheckups;
	export let inboundCheckups;

	async function handleCreateOutboundCheckup (e) {
		e.preventDefault();

		const create = await fetch(`${process.env.API_URL}/checkups`, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify(newOutboundCheckup),
		});

		if (create.ok) {
			window.location.reload();
		} else {
			// TODO
		}
	}

	async function handleCreateInboundCheckup (e) {
		e.preventDefault();

		const create = await fetch(`${process.env.API_URL}/checkups`, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify(newInboundCheckup),
		});

		if (create.ok) {
			window.location.reload();
		} else {
			// TODO
		}
	}
</script>

<svelte:head>
	<title>Checkups</title>
</svelte:head>

<section>
	<h2>Outbound Checkups</h2>

	<form on:submit={handleCreateOutboundCheckup}>
		<label>
			URL: <input type="url" required bind:value={newOutboundCheckup.url} >
		</label>

		<label>Interval:
			<select required bind:value={newOutboundCheckup.crontab}>
				<option value="* * * * *">Every Minute</option>
				<option value="0 * * * *" selected>Hourly</option>
				<option value="0 0 * * *">Daily</option>
				<option value="0 0 * * 0">Weekly</option>
			</select>
		</label>

		<button>Create</button>
	</form>

	{#each outboundCheckups as checkup, i}
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

<section>
	<h2>Inbound Checkups</h2>

	<form on:submit={handleCreateInboundCheckup}>
		<label>
			Description: <input type="text" required bind:value={newInboundCheckup.description} >
		</label>

		<label>Interval:
			<select required bind:value={newInboundCheckup.crontab}>
				<option value="* * * * *">Every Minute</option>
				<option value="0 * * * *" selected>Hourly</option>
				<option value="0 0 * * *">Daily</option>
				<option value="0 0 * * 0">Weekly</option>
			</select>
		</label>

		<button>Create</button>
	</form>

	{#each inboundCheckups as checkup, i}
		<div class="checkup">
			<div>{checkup.description}</div>
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
