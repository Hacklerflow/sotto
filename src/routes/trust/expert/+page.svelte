<script lang="ts">
	let { data }: { data: { buildHash: string } } = $props();
</script>

<svelte:head><title>Sotto: Technische Architektur</title></svelte:head>

<main>
	<a href="/trust" class="back">&larr; Übersicht</a>

	<h1>Technische Architektur</h1>
	<p class="lead">
		Diese Seite beschreibt die kryptografischen und architektonischen Maßnahmen,
		die Sotto einsetzt, um Anonymität nachweisbar zu garantieren.
	</p>

	<section>
		<h2>Blind RSA Signatures (RSABSSA)</h2>
		<p>
			Sotto verwendet <strong>RSABSSA-SHA384-PSS-Deterministic</strong> nach RFC 9474.
			Jede Umfrage generiert ein eigenes 2048-Bit-RSA-Schlüsselpaar. Der öffentliche Schlüssel
			ist unter <code>/survey/&lt;id&gt;/trust</code> einsehbar.
		</p>
		<p>
			Die Implementierung nutzt <code>@cloudflare/blindrsa-ts</code> — die Referenzimplementierung
			von Cloudflare, die direkt die Web Crypto API verwendet.
		</p>
		<div class="code-block">
			<div class="code-label">Protokollablauf</div>
			<pre><code>Client                              Server
  │                                    │
  │  1. POST /redeem (invitation)      │
  │ ──────────────────────────────────► │ markiert Einladung als eingelöst
  │                                    │
  │  blindedMsg = blind(token, pubKey) │
  │  2. POST /sign (blindedMsg)        │
  │ ──────────────────────────────────► │ signiert blind, ohne token zu kennen
  │  ◄──────────────────────────────── │ blindSig
  │                                    │
  │  sig = finalize(blindSig, inv)     │
  │                                    │
  │  3. POST /submit (answer + sig)    │ neue Verbindung, kein Session-Cookie
  │ ──────────────────────────────────► │ prüft sig gegen pubKey
  │                                    │ speichert Antwort (Answer-DB)</code></pre>
		</div>
		<p>
			Entscheidend: Zwischen Schritt 2 und 3 liegt ein Verbindungswechsel. Die Einreichung
			enthält keine Session-ID, keinen Cookie und keinen Referrer. Der Server kann die
			Signatur prüfen, aber nicht mit der Signieranfrage korrelieren.
		</p>
	</section>

	<section>
		<h2>Datenbanktrennung</h2>
		<p>
			Sotto betreibt zwei physisch getrennte PostgreSQL-Instanzen:
		</p>
		<div class="db-grid">
			<div class="db-card">
				<h3>Identity-DB</h3>
				<p>Einladungen, E-Mail-Hashes, Einlöse-Status, Gruppen. Weiß wer teilnehmen darf.</p>
			</div>
			<div class="db-card">
				<h3>Answer-DB</h3>
				<p>Umfragen, Schlüsselpaare, anonyme Antworten, Ergebnis-Snapshots. Weiß was geantwortet wurde.</p>
			</div>
		</div>
		<p>
			Es gibt keine Fremdschlüssel, keine gemeinsame Verbindung und keinen JOIN zwischen beiden.
			Die einzige Stelle, die beide liest, ist <code>getSurveyProgress()</code> — diese Funktion
			gibt ausschließlich Anzahlen zurück, keine Zuordnungen.
		</p>
	</section>

	<section>
		<h2>k-Anonymität</h2>
		<p>
			Ergebnisse werden erst sichtbar, wenn ein Schwellenwert erreicht ist.
			Numerische Dimensionen werden zusätzlich in Gruppen zusammengefasst (Binning),
			sodass auch aus der Verteilung keine Rückschlüsse auf einzelne Antworten möglich sind.
		</p>
	</section>

	<section>
		<h2>Was Sotto nicht schützt</h2>
		<p>
			Sotto garantiert Anonymität der Antworten, nicht absolute Privatsphäre.
			Netzwerkmetadaten (IP-Adresse, Timing) werden bei der Einreichung übertragen.
			Ein Reverse-Proxy oder VPN kann dieses Risiko mindern. Sotto selbst loggt keine
			IP-Adressen bei der Einreichung, aber das ist eine Konfigurationssache, kein
			kryptografisches Versprechen.
		</p>
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

	<section>
		<h2>Quellcode</h2>
		<p>
			Das Repository ist AGPL-3.0 lizenziert. Security-Audits und Pull Requests sind willkommen.
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
		margin: 0 0 var(--space-2);
	}
	h2 {
		font-size: var(--font-size-h4);
		margin: 0 0 var(--space-1);
	}
	h3 {
		font-size: var(--font-size-h5);
		margin: 0 0 var(--space-1);
	}
	.lead {
		font-size: var(--font-size-h5);
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0 0 var(--space-4);
	}
	section {
		margin-bottom: var(--space-4);
	}
	section p {
		color: var(--color-muted);
		line-height: 1.7;
	}
	code {
		background: var(--color-surface);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.9em;
	}
	.code-block {
		border: 1px solid var(--color-border);
		border-radius: 8px;
		overflow: hidden;
		margin: var(--space-2) 0;
	}
	.code-label {
		font-size: var(--font-size-small);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
		padding: 8px var(--space-2);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}
	.code-block pre {
		margin: 0;
		padding: var(--space-2);
		overflow-x: auto;
		font-size: 13px;
		line-height: 1.6;
	}
	.code-block code {
		background: none;
		padding: 0;
		border-radius: 0;
		font-size: inherit;
	}
	.db-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
		margin: var(--space-2) 0;
	}
	.db-card {
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}
	.db-card h3 {
		font-family: monospace;
	}
	.db-card p {
		margin: 0;
		font-size: var(--font-size-small);
	}
	.build-section {
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 12px;
	}
	.hash {
		font-weight: 600;
		word-break: break-all;
	}
	@media (max-width: 599px) {
		.db-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
