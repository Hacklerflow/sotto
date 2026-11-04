<script lang="ts">
	let { data }: { data: { buildHash: string } } = $props();
</script>

<svelte:head><title>Sotto: Technische Architektur</title></svelte:head>

<main>
	<h1>Technische Architektur</h1>

	<h2>Protokoll</h2>
	<p>
		Blind RSA Signatures nach RFC 9474 (RSABSSA, SHA-384, PSS). Jede Umfrage hat ein eigenes
		Schlüsselpaar. Der öffentliche Schlüssel steht auf <code>/survey/&lt;id&gt;/trust</code>.
	</p>

	<h2>Datenbanktrennung</h2>
	<p>
		Die Identity-DB speichert Nutzerinnen, Sitzungen und Einladungen. Die Answer-DB speichert
		Umfragen, Signaturschlüssel und Antworten. Es gibt keine Fremdschlüssel und keine gemeinsame
		Verbindung zwischen beiden. Nur ein Zähler (<code>getSurveyProgress</code>) liest beide und gibt
		ausschließlich Anzahlen zurück.
	</p>

	<h2>Was Blind Signatures leisten</h2>
	<p>
		Der Client verdeckt eine Nachricht, der Server signiert sie, der Client entfernt die
		Verdeckung. Die Signatur ist gültig, der Server kann sie aber keiner Signieranfrage zuordnen.
		Die Antwort wird mit der entblindeten Signatur eingereicht und gegen den Umfrage-Schlüssel
		geprüft.
	</p>

	<h2>Weitere Schutzmaßnahmen</h2>
	<p>Zeitliche Verzögerungen bei der Einreichung und eingefrorene Batch-Ergebnisse ab einer Mindestanzahl.</p>

	<h2>Quellcode</h2>
	<p>Das Repository ist AGPL-3.0 lizenziert; siehe LICENSE im Repository.</p>

	<h2>Build-Transparenz</h2>
	<p>Aktueller Build-Hash: <code>{data.buildHash}</code></p>
	<p>
		Der Build nutzt <code>npm ci</code> mit einem gepinnten Node-Image. Bitgenaue Reproduzierbarkeit
		ist damit nicht garantiert, aber der Build-Hash erlaubt es, den genauen Quellstand zu prüfen:
		Repository auf den Commit auschecken und den Code mit dem hier beschriebenen Verhalten abgleichen.
	</p>
</main>
