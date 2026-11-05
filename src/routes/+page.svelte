<script lang="ts">
	import TrustBadge from '../lib/components/TrustBadge.svelte';
</script>

<main>
	<section class="hero">
		<p class="logo">sotto</p>
		<h1>sotto voce</h1>
		<p class="tagline">Ehrliche Antworten, kryptografisch geschützt.</p>
		<p class="intro">
			Sotto ist eine Open-Source-Plattform für anonyme Gruppenumfragen.
			Deine Einladung berechtigt dich zu genau einer Antwort — aber die Antwort selbst wird
			kryptografisch von deiner Identität getrennt.
		</p>
	</section>

	<section class="features">
		<div class="feature">
			<h2>Kryptografische Anonymität</h2>
			<p>Blinde RSA-Signaturen (RFC 9474) trennen deine Identität von deiner Antwort — mathematisch, nicht durch Versprechen.</p>
		</div>
		<div class="feature">
			<h2>k-Anonymität</h2>
			<p>Ergebnisse erscheinen erst, wenn genug Menschen teilgenommen haben, damit sich niemand herauslesen lässt.</p>
		</div>
		<div class="feature">
			<h2>Getrennte Datenbanken</h2>
			<p>Identitäten und Antworten liegen in zwei physisch getrennten Datenbanken. Selbst ein Leak verbindet nichts.</p>
		</div>
	</section>

	<section class="cta">
		<a class="trust-link" href="/trust">So funktioniert die Anonymität</a>
		<a class="admin-link" href="/admin">Admin-Bereich</a>
	</section>
</main>

<footer class="trust-footer"><TrustBadge /></footer>

<style>
	main {
		max-width: 48rem;
		margin: 0 auto;
		padding: var(--space-3) var(--space-2);
	}
	.hero {
		min-height: 50dvh;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
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
	.intro {
		color: var(--color-muted);
		line-height: 1.7;
		max-width: 36rem;
	}
	.features {
		display: grid;
		gap: var(--space-3);
		margin: var(--space-4) 0;
	}
	.feature {
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 12px;
	}
	.feature h2 {
		font-size: var(--font-size-h5);
		margin: 0 0 var(--space-1);
	}
	.feature p {
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0;
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
		margin: var(--space-4) 0 var(--space-3);
	}
	.trust-link {
		display: inline-flex;
		align-items: center;
		min-height: 48px;
		padding: 0 24px;
		background: var(--color-primary);
		color: var(--color-bg);
		border-radius: 8px;
		font-weight: 700;
		text-decoration: none;
	}
	.trust-link:hover {
		opacity: 0.85;
	}
	.admin-link {
		display: inline-flex;
		align-items: center;
		min-height: 48px;
		color: var(--color-muted);
		font-weight: 400;
	}
	.trust-footer {
		max-width: 48rem;
		margin: 0 auto;
		padding: var(--space-2);
	}
	@media (min-width: 600px) {
		.features {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
