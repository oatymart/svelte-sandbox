<script>
	export let name;
</script>

<style lang="scss">
	// Framework styles
	@import '/pure-min.css'; // rollup-copy-plugin from node_modules to /public/

	// Platform styles
	:root {
		--the-color-purple: purple;
	}

	// Overrides
	@import './scss/scss_vars.scss'; // vars override must load BEFORE platform styles
	@import './scss/css_custom_props.scss'; // props override must load AFTER platform styles

	// Platform styles
	h1 {
		$theColorPurple: purple !default;
		color: var(--the-color-purple);
		color: $theColorPurple;
	}
</style>

<div>
	<h1>Hello {name}!</h1>
	<div class="pure-button-group" role="group" aria-label="...">
		<button class="pure-button">A Pure Button</button>
		<button class="pure-button" disabled>A Disabled Button</button>
		<button class="pure-button pure-button-active">An Active Button</button>
		<button class="pure-button pure-button-primary">A Primary Button</button>
	</div>
</div>
