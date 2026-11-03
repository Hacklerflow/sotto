<script lang="ts">
	let { data }: { data: { error: string } } = $props();
</script>

<main>
	<h1>Invitation not valid</h1>
	<p>{data.error}</p>
</main>
