<script lang="ts">
	let {
		data,
		form
	}: {
		data: { valid: boolean; error: string | null };
		form: { error: string } | null;
	} = $props();
</script>

<main>
	{#if data.valid}
		<h1>Join Survey</h1>
		{#if form?.error}
			<p>{form.error}</p>
		{/if}
		<form method="POST">
			<button type="submit">Join Survey</button>
		</form>
	{:else}
		<h1>Invitation not valid</h1>
		<p>{data.error}</p>
	{/if}
</main>
