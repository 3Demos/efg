<script>
    import { Canvas } from '@threlte/core'
    import Scene from './Scene.svelte'

    let particles = $state([
    
    ])

    let isPlaying = $state(false)
    let isReset = $state(false)

    $inspect("isReset var: " + isReset)




    function addParticle() {
        particles.push({x: 0, y: 2, z: 0, charge: -0.001})
        //console.log(particles)
    }




    function reset() {
        isPlaying=false
        isReset = true
        particles.length = 0
    }


    


    // instructions for the scene
    let instructions = $derived({
        particles: particles,
        play: isPlaying,
        reset: isReset
    })
 

</script>

<div class="pane">
    <h2>menu</h2>
    <div class="content">

        
        <button onclick={() => isPlaying = !isPlaying}>{isPlaying ? 'stop' : 'play'}</button>
        <button onclick={reset}>reset</button>
        <button onclick={addParticle}>add particle</button>
    </div>
  </div>
  


<Canvas>
  <Scene instructions={instructions} resetFunc={() => isReset = false}/>
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
  </style>



