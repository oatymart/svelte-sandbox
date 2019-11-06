<script>
	import TestRunner from './components/TestRunner.svelte';
	let name = 'Martin';
	let age = 37;

	$: uppercaseName = name.toUpperCase(); // reactive / computed value

	function alertMe() {
		alert('hey');
	}

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
	.app {
		padding: 0.5rem;
		h1 {
			$theColorPurple: purple !default;
			color: var(--the-color-purple);
			color: $theColorPurple;
		}
		.pure-button-group {
			margin-bottom: 1rem;
		}
	}
</style>

<div class="app">
	<h1>Hello {uppercaseName}!</h1>
	<div class="pure-button-group" role="group" aria-label="...">
		<button class="pure-button" on:click={alertMe}>A Pure Button</button>
		<button class="pure-button" disabled>A Disabled Button</button>
		<button class="pure-button pure-button-active">An Active Button</button>
		<button class="pure-button pure-button-primary">A Primary Button {age}</button>
	</div>
	<label for="nameField">Name:</label><input id="nameField" type="text" bind:value={name} />
	<TestRunner testId={42}></TestRunner>
</div>
