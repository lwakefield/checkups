<script>
	import { stores } from '@sapper/app';
	const { session } = stores();

	const user = $session.user;

	export let segment;
</script>

<style>
	nav {
		border-bottom: 1px solid var(--gray);
		font-weight: 300;
		padding: 0 1em;
		display: flex;
		justify-content: space-between;
	}

	ul {
		margin: 0;
		padding: 0;
		display: flex;
	}

	li {
		display: flex;
		padding: 0 0.5rem;
	}

	.selected {
		position: relative;
	}

	.selected::after {
		position: absolute;
		content: '';
		width: calc(100%);
		height: 2px;
		background-color: var(--red);
		display: block;
		bottom: -1px;
	}

	li > * {
		padding: 1rem 0;
	}

	a {
		text-decoration: none;
	}
</style>

<nav>
	<ul>
		<li><a class:selected='{segment === undefined}' href='/'>home</a></li>
		{#if user }
			<li><a class:selected='{segment === "checkups"}' href='/checkups'>checkups</a></li>
		{/if}
	</ul>
	<ul>
		{#if user }
			<li>
				<span>hello&nbsp;</span>
				<a class:selected='{segment === "me"}' href='/me'>
					{user.email}
				</a>
			</li>
		{:else}
			<li><a class:selected='{segment === "signup"}' href='/signup'>signup</a></li>
			<li><a class:selected='{segment === "signin"}' href='/signin'>signin</a></li>
		{/if}
	</ul>
</nav>
