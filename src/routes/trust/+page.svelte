<svelte:head><title>So funktioniert die Anonymität — Sotto</title></svelte:head>

<main>
	<a href="/" class="back">&larr; Startseite</a>

	<h1>Nicht Vertrauen. Mathematik.</h1>
	<p class="lead">
		Sotto trennt deine Identität von deiner Antwort — nicht durch Versprechen,
		sondern durch Kryptografie. Das Verfahren heißt Blind RSA Signature und ist ein
		offener Standard (RFC 9474). Der gesamte Code ist Open Source.
	</p>

	<section class="protocol">
		<h2>So funktioniert das Protokoll</h2>
		<div class="flow">
			<div class="flow-col">
				<span class="flow-label">Dein Gerät</span>
			</div>
			<div class="flow-col">
				<span class="flow-label">Server</span>
			</div>

			<div class="flow-step step-left">
				<div class="flow-number">1</div>
				<div class="flow-card">
					<strong>Einladung einlösen</strong>
					<p>Du klickst auf deinen Einladungslink. Der Server prüft, ob du berechtigt bist, und markiert die Einladung als eingelöst.</p>
				</div>
			</div>

			<div class="flow-step step-left">
				<div class="flow-number">2</div>
				<div class="flow-card">
					<strong>Marke verdecken</strong>
					<p>Dein Browser erzeugt eine zufällige Marke und verdeckt sie kryptografisch. Der Server sieht nur die verdeckte Version.</p>
				</div>
			</div>

			<div class="flow-arrow">&rarr;</div>

			<div class="flow-step step-right">
				<div class="flow-number">3</div>
				<div class="flow-card">
					<strong>Blind signieren</strong>
					<p>Der Server signiert die verdeckte Marke, ohne ihren Inhalt zu kennen. Er weiß: diese Person darf antworten. Aber nicht, welche Marke er gerade signiert hat.</p>
				</div>
			</div>

			<div class="flow-arrow">&larr;</div>

			<div class="flow-step step-left">
				<div class="flow-number">4</div>
				<div class="flow-card">
					<strong>Verdeckung entfernen</strong>
					<p>Dein Gerät entfernt die kryptografische Verdeckung. Die Signatur ist gültig — aber der Server kann sie keiner Signieranfrage zuordnen.</p>
				</div>
			</div>

			<div class="flow-step step-left">
				<div class="flow-number">5</div>
				<div class="flow-card">
					<strong>Anonym absenden</strong>
					<p>Deine Antwort wird zusammen mit der entblindeten Signatur eingereicht. Der Server prüft die Signatur und speichert die Antwort — ohne zu wissen, von wem sie stammt.</p>
				</div>
			</div>
		</div>
	</section>

	<section class="guarantees">
		<h2>Drei Garantien</h2>
		<div class="guarantee-grid">
			<div class="guarantee-card">
				<div class="guarantee-icon">
					<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<path d="M16 3L4 8v7c0 7.73 5.12 14.97 12 17 6.88-2.03 12-9.27 12-17V8L16 3z" stroke="currentColor" stroke-width="2" fill="none"/>
						<path d="M11 16l3.5 3.5L21 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<h3>Mathematische Anonymität</h3>
				<p>Blinde Signaturen machen es mathematisch unmöglich, eine Antwort einer Person zuzuordnen — selbst für den Betreiber.</p>
			</div>
			<div class="guarantee-card">
				<div class="guarantee-icon">
					<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<rect x="3" y="6" width="11" height="20" rx="2" stroke="currentColor" stroke-width="2"/>
						<rect x="18" y="6" width="11" height="20" rx="2" stroke="currentColor" stroke-width="2"/>
						<line x1="14" y1="16" x2="18" y2="16" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
					</svg>
				</div>
				<h3>Getrennte Datenbanken</h3>
				<p>Identitäten und Antworten liegen in zwei physisch getrennten Datenbanken. Es gibt keine Verbindung zwischen ihnen — selbst ein Leak verbindet nichts.</p>
			</div>
			<div class="guarantee-card">
				<div class="guarantee-icon">
					<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<circle cx="10" cy="16" r="3" stroke="currentColor" stroke-width="2"/>
						<circle cx="22" cy="16" r="3" stroke="currentColor" stroke-width="2"/>
						<circle cx="16" cy="8" r="3" stroke="currentColor" stroke-width="2"/>
						<circle cx="16" cy="24" r="3" stroke="currentColor" stroke-width="2"/>
						<line x1="13" y1="16" x2="19" y2="16" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/>
					</svg>
				</div>
				<h3>k-Anonymität</h3>
				<p>Ergebnisse erscheinen erst, wenn genug Personen geantwortet haben. Einzelne Stimmen lassen sich nie herauslesen.</p>
			</div>
		</div>
	</section>

	<section class="open-source">
		<h2>Überprüfbar, nicht vertrauenspflichtig</h2>
		<p>
			Sotto ist Open Source unter der AGPL-3.0-Lizenz. Der gesamte Quellcode ist einsehbar.
			Du musst uns nicht vertrauen — du kannst den Code prüfen, selbst hosten und die
			kryptografischen Operationen auf deinem Gerät in den Browser-DevTools nachvollziehen.
		</p>
	</section>

	<a href="/trust/expert" class="expert-link">Technische Details für Expertinnen und Experten &rarr;</a>
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
		line-height: 1.15;
		margin: 0 0 var(--space-2);
	}
	h2 {
		font-size: var(--font-size-h4);
		margin: 0 0 var(--space-3);
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

	.protocol {
		margin-bottom: var(--space-4);
	}
	.flow {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
		position: relative;
	}
	.flow-col {
		min-height: 0;
	}
	.flow-label {
		display: block;
		font-size: var(--font-size-small);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
		padding-bottom: var(--space-1);
		border-bottom: 2px solid var(--color-border);
		margin-bottom: var(--space-1);
	}
	.flow-step {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}
	.step-left {
		grid-column: 1;
	}
	.step-right {
		grid-column: 2;
	}
	.flow-arrow {
		grid-column: 1 / -1;
		text-align: center;
		font-size: 1.5rem;
		color: var(--color-muted);
		padding: 4px 0;
	}
	.flow-number {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-primary);
		color: var(--color-bg);
		font-weight: 900;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.flow-card {
		flex: 1;
	}
	.flow-card strong {
		display: block;
		margin-bottom: 4px;
	}
	.flow-card p {
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0;
		font-size: var(--font-size-small);
	}

	.guarantees {
		margin-bottom: var(--space-4);
	}
	.guarantee-grid {
		display: grid;
		gap: var(--space-2);
	}
	.guarantee-card {
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 12px;
	}
	.guarantee-icon {
		margin-bottom: var(--space-2);
		color: var(--color-primary);
	}
	.guarantee-card p {
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0;
	}

	.open-source {
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		margin-bottom: var(--space-3);
	}
	.open-source h2 {
		margin-bottom: var(--space-1);
	}
	.open-source p {
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0;
	}

	.expert-link {
		display: inline-block;
		font-weight: 700;
		font-size: var(--font-size-h5);
		margin-bottom: var(--space-4);
	}

	@media (min-width: 600px) {
		.guarantee-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 599px) {
		.flow {
			grid-template-columns: 1fr;
		}
		.step-right {
			grid-column: 1;
		}
		.flow-col:last-child {
			display: none;
		}
		.flow-arrow {
			grid-column: 1;
		}
	}
</style>
