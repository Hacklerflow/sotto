<script lang="ts">
	let {
		value,
		context,
		subtitle,
		accentColor = '#ff2d55'
	}: { value: number | string; context: string; subtitle: string; accentColor?: string } = $props();
</script>

<div class="hero">
	<div class="value" style="font-size: 96px; font-weight: 900;">{value}</div>
	<div class="context">{context}</div>
	<div class="subtitle" style="color: {accentColor};">{subtitle}</div>
</div>

<style>
	.hero {
		margin: var(--space-3) 0;
	}
	.value {
		line-height: 1;
		letter-spacing: -0.04em;
	}
	.context {
		font-size: 15px;
		font-weight: 300;
	}
	.subtitle {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	@media (max-width: 600px) {
		.value {
			font-size: 72px !important;
		}
	}
</style>
