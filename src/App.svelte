<script>
	export let name;
</script>

<style lang="scss">
	:root {
		--the-color-purple: purple;
	}

	@import './scss/scss_vars.scss';

	@import './scss/css_custom_props.scss';

	h1 {
		$theColorPurple: purple !default;

		color: var(--the-color-purple);
		color: $theColorPurple;
	}
</style>

<div>
	<h1>Hello {name}!</h1>
</div>
