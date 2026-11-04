<div class="landing">
	<p class="logo">sotto</p>
	<h1>sotto voce</h1>
	<p class="tagline">Die Wahrheit, die man nur leise sagt.</p>
	<p>
		Sotto ist eine Umfrage-Plattform für Gruppen, in der niemand erfährt, wer was geantwortet hat. Deine
		Einladung berechtigt dich zu genau einer Antwort, aber die Antwort selbst wird kryptografisch von
		deiner Identität getrennt. Ergebnisse erscheinen erst, wenn genug Menschen teilgenommen haben, damit
		sich niemand herauslesen lässt.
	</p>
	<div class="actions">
		<a class="trust-link" href="/trust">So funktioniert die Anonymität</a>
		<a class="admin-link" href="/admin">Admin-Bereich</a>
	</div>
</div>

<style>
	.logo {
		margin: 0;
		font-size: clamp(3rem, 18vw, 6rem);
		font-weight: 900;
		letter-spacing: -0.04em;
		line-height: 1;
	}
	h1 {
		font-size: var(--font-size-h4);
		font-weight: 400;
		font-style: italic;
		margin: 0;
	}
	.tagline {
		font-size: var(--font-size-h5);
		color: var(--color-accent);
		margin: var(--space-1) 0 var(--space-3);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}
	.trust-link,
	.admin-link {
		display: inline-flex;
		align-items: center;
		min-height: 48px;
		font-weight: 700;
	}
	.admin-link {
		font-weight: 400;
		color: var(--color-muted);
	}
</style>
