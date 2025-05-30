<script lang="ts">
    import { Canvas } from '@threlte/core'
    import Scene from './Scene.svelte'

    let isPlaying = $state(false)
    let isReset = $state(false)
    let addMode = $state(false)
    let addCharge = $state(0)
    let showTrace = $state(false)

    function addProton() {
        resetNewParticleCoords()
        addMode = true
        addCharge = 0.001

        activePane = 'proton'
    }

    function addElectron() {
        resetNewParticleCoords()
        addMode = true
        addCharge = -0.001

        activePane = 'electron'
    }

    function reset() {
        isPlaying=false
        isReset = true
        addCharge = 0
        addMode = false
        showTrace = false
        confirmAddChoice = false
        resetNewParticleCoords()

    }





    // CODE FOR INTERACTIVE PANE

    let activePane = $state('');

    let newParticleX: number | null = $state(null)
    let newParticleY: number | null = $state(null)
    let newParticleZ: number | null = $state(null)

    let newParticleCoords = $derived([newParticleX, newParticleY, newParticleZ])
    
    let confirmAddChoice = $state(false)

   



    // for display on coords

    let newParticleDisplayX: string = $state("X")
    let newParticleDisplayY: string = $state("Y")
    let newParticleDisplayZ: string = $state("Z")


    function modifyNewParticleCoords([x, y, z] : [number, number, number]) {
        newParticleDisplayX = x.toFixed(3);
        newParticleDisplayY = y.toFixed(3);
        newParticleDisplayZ = z.toFixed(3);
    }

    function resetNewParticleCoords() {
        newParticleX = null
        newParticleY = null
        newParticleZ = null

        newParticleDisplayX = "X"
        newParticleDisplayY = "Y"
        newParticleDisplayZ = "Z"
    }


    // instructions for the scene
    let instructions = $derived({
        play: isPlaying,
        reset: isReset,
        charge: addCharge,
        addMode: addMode,
        showTrace: showTrace,
        newParticleCoords: newParticleCoords,
        confirmAddChoice: confirmAddChoice
    })




</script>

<div class="pane">
    <div class="content">

        {#if !activePane || !addMode}
        
        <button onclick={() => isPlaying = !isPlaying}>{isPlaying ? 'stop' : 'play'}</button>
        <button onclick={reset}>reset</button>
        <button onclick={addProton}>add proton</button>
        <button onclick={addElectron}>add electron</button>
        <button onclick={() => showTrace = !showTrace}>{showTrace ? 'hide' : 'show'} trace</button>
        <!-- <button onclick={addParticle}>add particle</button> -->

        {:else}

            {#if addMode}
            <div class="interactive-content">
                <span class="label">
                {#if activePane === 'proton'}Add Proton{:else if activePane === 'electron'}Add Electron{/if}
                </span>
                <div class="form-fields">
                {#if activePane === 'proton' || activePane === 'electron'}
                    <input bind:value={newParticleX} type="number" placeholder={newParticleDisplayX} />
                    <input bind:value={newParticleY} type="number" placeholder={newParticleDisplayY}  />
                    <input bind:value={newParticleZ} type="number" placeholder={newParticleDisplayZ}  />
                {/if}
                <button onclick={() => {activePane = ''; confirmAddChoice = true}}>Done</button>
                </div>
            </div>

            {/if}
        {/if}


    </div>
 </div>


  


<Canvas>
  <Scene 
  instructions={instructions} 
  resetFunc={() => isReset = false} 
  addModeFunc={() => {addMode = false; confirmAddChoice = false}} 
  chargeFunc={() => addCharge = 0}
  resetNewParticleCoords={resetNewParticleCoords} 
  modifyNewParticleCoords = {modifyNewParticleCoords}
  
  />
</Canvas>


<style>

.pane {
    position: fixed;
    bottom: 3em;
    left: 50%;
    transform: translateX(-50%);
    width: 500px;
    background-color: white; /* changed from #222 */
    color: black; /* updated for contrast on white */
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    font-family: sans-serif;
    z-index: 1000;
}

.pane button {
    cursor: pointer; /* enables text-selection cursor on hover */
}

.content {
    display: flex;
    flex-direction: row;
    gap: 2rem;
    flex-wrap: wrap;      /* allows wrapping if buttons overflow */
    justify-content: center; /* optional: center-align buttons */
}

.interactive-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.label {
  font-weight: bold;
  min-width: 80px;
  text-align: left;
}

.form-fields {

  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-grow: 1;
}

.form-fields input {
    
  width: 60px;
  padding: 0.25rem;
  font-size: 0.9rem;
  justify-content:center;

}

.form-fields button {
  margin-left: auto;
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



