<svelte:head><title>Wie Sotto dich anonym hält</title></svelte:head>

<main>
	<a href="/" class="back">&larr; Startseite</a>

	<h1>Deine Antworten bleiben anonym.</h1>
	<p class="lead">
		Deine Antworten werden auf deinem Gerät anonymisiert, bevor sie unseren Server erreichen.
		Niemand, auch wir nicht, kann sie später mit dir verbinden.
	</p>

	<ol class="steps">
		<li>
			<div class="step-number">1</div>
			<div class="step-content">
				<h2>Du bekommst eine Einladung</h2>
				<p>Wir wissen, dass du teilnehmen darfst, und markieren die Einladung als eingelöst.</p>
			</div>
		</li>
		<li>
			<div class="step-number">2</div>
			<div class="step-content">
				<h2>Dein Gerät verdeckt eine Marke</h2>
				<p>Dein Browser erzeugt eine zufällige Marke und verdeckt sie, bevor er sie sendet.</p>
			</div>
		</li>
		<li>
			<div class="step-number">3</div>
			<div class="step-content">
				<h2>Der Server signiert blind</h2>
				<p>Wir bestätigen die verdeckte Marke, ohne ihren Inhalt zu sehen.</p>
			</div>
		</li>
		<li>
			<div class="step-number">4</div>
			<div class="step-content">
				<h2>Du sendest anonym ab</h2>
				<p>
					Dein Gerät entfernt die Verdeckung. Die Marke beweist, dass du berechtigt bist, aber nicht,
					wer du bist.
				</p>
			</div>
		</li>
	</ol>

	<section class="separation">
		<h2>Zwei getrennte Welten</h2>
		<p>
			Einladungen und Antworten liegen in zwei physisch getrennten Datenbanken.
			Ergebnisse erscheinen erst, wenn genug Personen geantwortet haben.
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
		font-size: var(--font-size-h5);
		margin: 0 0 var(--space-1);
	}
	.lead {
		font-size: var(--font-size-h5);
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0 0 var(--space-4);
	}
	.steps {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin: 0 0 var(--space-4);
	}
	.steps li {
		display: flex;
		gap: var(--space-3);
	}
	.step-number {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--color-primary);
		color: var(--color-bg);
		font-weight: 900;
		font-size: 1.1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.step-content p {
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0;
	}
	.separation {
		padding: var(--space-3);
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		margin-bottom: var(--space-3);
	}
	.separation p {
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0;
	}
	.expert-link {
		display: inline-block;
		font-weight: 700;
		font-size: var(--font-size-h5);
	}
</style>
