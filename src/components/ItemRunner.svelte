<script>
    export let itemId = Math.floor(100 * Math.random());
</script>

<style lang="scss">
    .item-runner {
        padding: 2rem;
        h3 {
            letter-spacing: 0.2em;
            color: yellow;
        }
    }
</style>

<div class="item-runner">
    <h3>Item id is {itemId}</h3>
    <img class="pure-img" src="https://via.placeholder.com/250x150"/>
</div>