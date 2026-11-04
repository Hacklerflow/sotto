<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<main class="page">
	{@render children()}
</main>
