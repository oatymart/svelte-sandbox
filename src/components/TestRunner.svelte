<script>
	import ItemRunner from './ItemRunner.svelte';
    export let testId;
</script>

<style lang="scss">
    .test-runner {
        padding: 2rem;
        h2 {
            letter-spacing: 0.1em;
            color: limegreen;
        }
    }
</style>

<div class="test-runner">
  <h2>Test id is {testId}</h2>
  <ItemRunner></ItemRunner>
</div>
