<script lang="ts">
    import ThreeScene from './Three.svelte';
    let sceneRef: any;
    let decayRate = 2;
    let puckCharge = 10;
    let showTrace = false;
    let chargeType: 'positive' | 'negative' = 'positive';
    let currentStep = 0;
  
    function onStep(event: CustomEvent<number>) {
      currentStep = event.detail;
    }
    function selectPositive() { chargeType = 'positive'; }
    function selectNegative() { chargeType = 'negative'; }
    function play() { sceneRef.play(); }
    function reset() { sceneRef.resetSim(); sceneRef.updateField()}
    function zoomIn() { sceneRef.zoomIn(); }
    function zoomOut() { sceneRef.zoomOut(); }
    function resetView() { sceneRef.resetView(); }
  </script>
  
  <div class="canvas-container">
    <ThreeScene
      bind:this={sceneRef}
      {decayRate}
      {puckCharge}
      {showTrace}
      {chargeType}
      on:step={onStep}
    />
  </div>
  
  <div class="controls">
    <button class="play" on:click={play}>Play</button>
    <button class="reset" on:click={reset}>Reset</button>
    <span class="step-count">{currentStep}</span>
    <button on:click={selectPositive} style="background:#0000ff;color:#fff;">⊕</button>
    <button on:click={selectNegative} style="background:#ff0000;color:#fff;">⊖</button>
    <button on:click={zoomOut}>🔍–</button>
    <button on:click={resetView}>🔍○</button>
    <button on:click={zoomIn}>🔍＋</button>
    <label>Decay rate <input type="number" bind:value={decayRate} /></label>
    <label>Puck charge <input type="number" bind:value={puckCharge} /></label>
    <label>Show Trace <input type="checkbox" bind:checked={showTrace} /></label>
  </div>
  
  <style>
    .canvas-container { width: 100%; height: 80vh; }
    .controls { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-top: 1rem; }
    .controls button, .controls input, .controls label { padding: 0.5rem; font-size: 0.9rem; }
  </style>
