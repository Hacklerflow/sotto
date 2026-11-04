<svelte:head><title>Wie Sotto dich anonym hält</title></svelte:head>

<main>
	<h1>Deine Antworten bleiben anonym.</h1>
	<p class="lead">
		Deine Antworten werden auf deinem Gerät anonymisiert, bevor sie unseren Server erreichen.
		Niemand, auch wir nicht, kann sie später mit dir verbinden.
	</p>

	<ol>
		<li>
			<h2>Du bekommst eine Einladung</h2>
			<p>Wir wissen, dass du teilnehmen darfst, und markieren die Einladung als eingelöst.</p>
		</li>
		<li>
			<h2>Dein Gerät verdeckt eine Marke</h2>
			<p>Dein Browser erzeugt eine zufällige Marke und verdeckt sie, bevor er sie sendet.</p>
		</li>
		<li>
			<h2>Der Server signiert blind</h2>
			<p>Wir bestätigen die verdeckte Marke, ohne ihren Inhalt zu sehen.</p>
		</li>
		<li>
			<h2>Du sendest anonym ab</h2>
			<p>
				Dein Gerät entfernt die Verdeckung. Die Marke beweist, dass du berechtigt bist, aber nicht,
				wer du bist.
			</p>
		</li>
	</ol>

	<p>
		Einladungen und Antworten liegen in zwei getrennten Datenbanken. Ergebnisse erscheinen erst, wenn
		genug Personen geantwortet haben.
	</p>
	<p><a href="/trust/expert"><strong>Technische Details für Expertinnen und Experten</strong></a></p>
</main>
