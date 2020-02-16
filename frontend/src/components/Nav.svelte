<script>
	import { stores } from '@sapper/app';
	const { session } = stores();

	const user = $session.user;

	export let segment;
</script>

<style>
	nav {
		border-bottom: 1px solid rgba(255,62,0,0.1);
		font-weight: 300;
		padding: 0 1em;
		display: flex;
		justify-content: space-between;
	}

	ul {
		margin: 0;
		padding: 0;
	}

	/* clearfix */
	ul::after {
		content: '';
		display: block;
		clear: both;
	}

	li {
		display: block;
		float: left;
	}

	.selected {
		position: relative;
		display: inline-block;
	}

	.selected::after {
		position: absolute;
		content: '';
		width: calc(100% - 1em);
		height: 2px;
		background-color: rgb(255,62,0);
		display: block;
		bottom: -1px;
	}

	a, span {
		text-decoration: none;
		padding: 1em 0.5em;
		display: block;
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
			<span>hello {user.email}</span>
		{:else}
			<li><a class:selected='{segment === "signup"}' href='/signup'>signup</a></li>
			<li><a class:selected='{segment === "signin"}' href='/signin'>signin</a></li>
		{/if}
	</ul>
</nav>
