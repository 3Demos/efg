<script>
    import { Canvas } from '@threlte/core'
    import Scene from './Scene.svelte'

  

    let isPlaying = $state(false)
    let isReset = $state(false)
    let addMode = $state(false)
    let addCharge = $state(0)
    let showTrace = $state(false)
    

    //$inspect("isReset var: " + isReset)

    // function addParticle() {
    //     addMode = true
    // }

    function addProton() {
        addMode = true
        addCharge = 0.001
    }

    function addElectron() {
        addMode = true
        addCharge = -0.001
    }

    function reset() {
        isPlaying=false
        isReset = true
        addCharge = 0
        addMode = false
        showTrace = false
    }

    // instructions for the scene
    let instructions = $derived({
        play: isPlaying,
        reset: isReset,
        charge: addCharge,
        addMode: addMode,
        showTrace: showTrace
    })
 

</script>

<div class="pane">
    <h2>menu</h2>
    <div class="content">

        
        <button onclick={() => isPlaying = !isPlaying}>{isPlaying ? 'stop' : 'play'}</button>
        <button onclick={reset}>reset</button>
        <button onclick={addProton}>add proton</button>
        <button onclick={addElectron}>add electron</button>
        <button onclick={() => showTrace = !showTrace}>{showTrace ? 'hide' : 'show'} trace</button>
        <!-- <button onclick={addParticle}>add particle</button> -->
    </div>
 </div>


<Canvas>
  <Scene instructions={instructions} resetFunc={() => isReset = false} addModeFunc={() => addMode = false} chargeFunc={() => addCharge = 0}/>
</Canvas>


<style>

.pane {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 220px;
    background-color: #222;
    color: #fff;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    font-family: sans-serif;
    z-index: 1000;
}

.pane h2 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    border-bottom: 1px solid #444;
    padding-bottom: 0.5rem;
}

.content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}


    :global(canvas) {
    width: 100%;
    height: 100vh;
    display: block;
    }

    :global(html, body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

:global(body) {
    position: relative;
}

:global(canvas) {
    width: 100vw;
    height: 100vh;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
}
</style>



