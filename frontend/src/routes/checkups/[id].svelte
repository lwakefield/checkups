<script context="module">
	import { scaleLinear } from 'd3-scale';

	export async function preload({ params, query }) {
		const checkup = await this.fetch(
			`${process.env.API_URL}/checkups/${params.id}`, {
				credentials: 'include',
			}
		);

		const targetStatusUrl = new URL(`${process.env.API_URL}/status`);
		targetStatusUrl.searchParams.set('limit', 50);
		targetStatusUrl.searchParams.set('checkupId', params.id);
		if (query.beforeId) targetStatusUrl.searchParams.set('beforeId', query.beforeId);

		const statuses = await this.fetch(
			targetStatusUrl.toString(), {
				credentials: 'include',
			}
		);

		return {
			checkup: await checkup.json(),
			statuses: await statuses.json(),
			nextPage: statuses.headers.get('x-next-page'),
			prevPage: statuses.headers.get('x-prev-page'),
		};
	}
</script>

<script>

	export let checkup;
	export let statuses;
	export let nextPage;
	export let prevPage;

	$: sortedStatuses = statuses.sort((a, b) => b.dueAt - a.dueAt);
	$: maxStatusTimestamp = new Date(sortedStatuses[0].dueAt).valueOf();
	$: minStatusTimestamp = new Date(sortedStatuses[sortedStatuses.length - 1].dueAt).valueOf();
	$: timespan = maxStatusTimestamp - minStatusTimestamp;

	let width = 448;
	$: xScale = scaleLinear()
		.domain([minStatusTimestamp, maxStatusTimestamp])
		.range([0, width - 3]);

</script>

<style>
	.ok {
		color: var(--green);
	}
	.notOk {
		color: var(--red);
	}
	svg {
		width: 100%;
		height: 20px;
	}
</style>

<svelte:head>
	<title>{checkup.url}</title>
</svelte:head>

<h2>{checkup.url}</h2>

<br>

<div bind:clientWidth={width}>
	<svg>
		{#each statuses as status, i}
			<rect
				width="3"
				height="100%"
				fill={ status.status === 200 ? "var(--green)" : "var(--red)" }
				x="{xScale(new Date(status.dueAt).valueOf())}"
			/>
		{/each}
	</svg>
</div>

<br>

<h3>logs</h3>
{#each Array.from(statuses) as status, i}
	<div>
		<span
			class:ok="{status.status === 200}"
			class:notOk="{status.status !== 200}"
		>{status.status}</span>
		<span>{status.dueAt}</span>
	</div>
{/each}

{#if prevPage}
	<a href="/checkups/{checkup.id}{prevPage}">Newer</a>
{/if}
{#if nextPage}
	<a href="/checkups/{checkup.id}{nextPage}">Older</a>
{/if}
