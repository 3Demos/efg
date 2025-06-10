<script lang="ts">
  import Three from './Three.svelte';
  import type { ThreeComponent } from './Three.svelte';
  
  let threeComponent: ThreeComponent;
  let isPlaying = $state(false);
  let puckCharge = $state(10);
  let decayRate = $state(2);
  let showTrace = $state(false);
</script>

<div class="container">
  <div class="controls">
    <div class="main-controls">
      <button on:click={() => {
        isPlaying = !isPlaying;
        if (isPlaying) {
          threeComponent.play();
        } else {
          threeComponent.pause();
        }
      }}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      
      <button on:click={() => threeComponent.reset()}>
        Reset
      </button>

      <button on:click={() => threeComponent.addBlueCharge()} class="blue">
        Add Positive Charge
      </button>
      
      <button on:click={() => threeComponent.addRedCharge()} class="red">
        Add Negative Charge
      </button>
    </div>

    <div class="sliders">
      <label>
        Puck Charge:
        <input 
          type="range" 
          min="1" 
          max="20" 
          bind:value={puckCharge}
          on:input={() => threeComponent.setPuckCharge(puckCharge)}
        />
        {puckCharge}
      </label>

      <label>
        Decay Rate:
        <input 
          type="range" 
          min="1" 
          max="5" 
          step="0.1"
          bind:value={decayRate}
          on:input={() => threeComponent.setDecayRate(decayRate)}
        />
        {decayRate}
      </label>

      <label>
        Show Trace:
        <input 
          type="checkbox" 
          bind:checked={showTrace}
          on:change={() => threeComponent.setShowTrace(showTrace)}
        />
      </label>
    </div>
  </div>

  <div class="simulation">
    <Three bind:this={threeComponent} />
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .controls {
    padding: 1rem;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  .main-controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .sliders {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .simulation {
    flex: 1;
    position: relative;
  }

  button {
    padding: 0.5rem 1rem;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: #4CAF50;
  }

  button:hover {
    opacity: 0.9;
  }

  button.blue {
    background: #2196F3;
  }

  button.red {
    background: #f44336;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  input[type="range"] {
    width: 100px;
  }
</style>
