<script lang="ts">
	import TrustBadge from '../../../../lib/components/TrustBadge.svelte';

	type TrustData = {
		invited: number;
		responded: number;
		thresholdMet: boolean;
		requiredCount: number;
		publicKey: string;
	};
	let { data }: { data: TrustData } = $props();
	let copied = $state(false);

	async function copyKey() {
		await navigator.clipboard.writeText(data.publicKey);
		copied = true;
	}
</script>

<svelte:head><title>Vertrauen in diese Umfrage</title></svelte:head>

<main>
	<h1>Vertrauen in diese Umfrage</h1>
	<p>{data.invited} Teilnehmer eingeladen</p>
	<p>{data.responded} haben geantwortet</p>
	<p>
		Schwelle erreicht ({data.requiredCount} Antworten): {data.thresholdMet ? 'ja' : 'nein'}
	</p>

	<h2>Öffentlicher Schlüssel</h2>
	<p>Damit lässt sich die Signaturkette dieser Umfrage prüfen.</p>
	<textarea readonly rows="6" aria-label="Öffentlicher Schlüssel (Base64, SPKI)">{data.publicKey}</textarea>
	<button type="button" onclick={copyKey}>{copied ? 'Kopiert' : 'Kopieren'}</button>

	<p><TrustBadge /></p>
</main>
