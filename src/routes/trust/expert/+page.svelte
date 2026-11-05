<script lang="ts">
	let { data }: { data: { buildHash: string } } = $props();
</script>

<svelte:head><title>Sotto: Technische Architektur</title></svelte:head>

<main>
	<a href="/trust" class="back">&larr; Übersicht</a>

	<h1>Technische Architektur</h1>

	<section>
		<h2>Protokoll</h2>
		<p>
			Blind RSA Signatures nach RFC 9474 (RSABSSA, SHA-384, PSS). Jede Umfrage hat ein eigenes
			Schlüsselpaar. Der öffentliche Schlüssel steht auf <code>/survey/&lt;id&gt;/trust</code>.
		</p>
	</section>

	<section>
		<h2>Datenbanktrennung</h2>
		<p>
			Die Identity-DB speichert Nutzerinnen, Sitzungen und Einladungen. Die Answer-DB speichert
			Umfragen, Signaturschlüssel und Antworten. Es gibt keine Fremdschlüssel und keine gemeinsame
			Verbindung zwischen beiden. Nur ein Zähler (<code>getSurveyProgress</code>) liest beide und gibt
			ausschließlich Anzahlen zurück.
		</p>
	</section>

	<section>
		<h2>Was Blind Signatures leisten</h2>
		<p>
			Der Client verdeckt eine Nachricht, der Server signiert sie, der Client entfernt die
			Verdeckung. Die Signatur ist gültig, der Server kann sie aber keiner Signieranfrage zuordnen.
			Die Antwort wird mit der entblindeten Signatur eingereicht und gegen den Umfrage-Schlüssel
			geprüft.
		</p>
	</section>

	<section>
		<h2>Weitere Schutzmaßnahmen</h2>
		<p>Zeitliche Verzögerungen bei der Einreichung und eingefrorene Batch-Ergebnisse ab einer Mindestanzahl.</p>
	</section>

	<section>
		<h2>Quellcode</h2>
		<p>Das Repository ist AGPL-3.0 lizenziert; siehe LICENSE im Repository.</p>
	</section>

	<section class="build-section">
		<h2>Build-Transparenz</h2>
		<p>Aktueller Build-Hash: <code class="hash">{data.buildHash}</code></p>
		<p>
			Der Build nutzt <code>npm ci</code> mit einem gepinnten Node-Image. Bitgenaue Reproduzierbarkeit
			ist damit nicht garantiert, aber der Build-Hash erlaubt es, den genauen Quellstand zu prüfen:
			Repository auf den Commit auschecken und den Code mit dem hier beschriebenen Verhalten abgleichen.
		</p>
	</section>
</main>

<style>
	main {
		max-width: 48rem;
		margin: 0 auto;
		padding: var(--space-3) var(--space-2);
	}
	.back {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		display: inline-block;
		margin-bottom: var(--space-3);
	}
	.back:hover {
		color: var(--color-primary);
	}
	h1 {
		font-size: var(--font-size-h2);
		margin: 0 0 var(--space-4);
	}
	h2 {
		font-size: var(--font-size-h4);
		margin: 0 0 var(--space-1);
	}
	section {
		margin-bottom: var(--space-4);
	}
	section p {
		color: var(--color-muted);
		line-height: 1.7;
	}
	code {
		background: #f5f5f5;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.9em;
	}
	.build-section {
		padding: var(--space-3);
		border: 1px solid #e0e0e0;
		border-radius: 12px;
	}
	.hash {
		font-weight: 600;
		word-break: break-all;
	}
</style>
