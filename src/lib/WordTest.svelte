<script lang="ts">
  import type { WordItem, RewardType } from './types';

  interface Props {
    setIdx: number;
    words: WordItem[];
    rewardType: RewardType;
    onHome: () => void;
    onNext: () => void;
    setImages: string[];
  }

  let { setIdx, words, rewardType, onHome, onNext, setImages }: Props = $props();

  let currentIdx = $state(0);
  let userInput = $state("");
  let answered = $state<boolean[]>(new Array(20).fill(false));
  let correct = $state<boolean[]>(new Array(20).fill(false));
  let shuffledBank = $state<string[]>([]);
  let showWrongNotes = $state(false);
  let isReviewMode = $state(false);
  let isInverted = $state(false); 
  let sessionWords = $state<WordItem[]>([...words]);

  $effect(() => { if (setIdx !== undefined) resetSet(); });

  function resetSet() {
    currentIdx = 0; userInput = "";
    answered = new Array(20).fill(false);
    correct = new Array(20).fill(false);
    isInverted = false;
    sessionWords = [...words];
    updateBank(setIdx % 2 === 0); 
    showWrongNotes = false; isReviewMode = false;
  }

  function updateBank(forceType?: boolean) {
    const targetType = forceType !== undefined ? forceType : isStepFive;
    if (!targetType) {
      shuffledBank = [...sessionWords].map(w => w.word).sort(() => Math.random() - 0.5);
    } else {
      shuffledBank = [];
    }
  }

  let currentWord = $derived(sessionWords[currentIdx]);
  let isAllAnswered = $derived(answered.every(a => a));
  let isStepFive = $derived.by(() => {
    const defaultType = (setIdx % 2 === 0);
    return isInverted ? !defaultType : defaultType;
  });

  let targetAnswer = $derived(isStepFive ? currentWord.word : currentWord.trans_word);
  let wrongWords = $derived(sessionWords.filter((_, i) => answered[i] && !correct[i]));

  let completionRate = $derived.by(() => {
    const totalCorrect = correct.filter(c => c).length;
    return isStepFive 
      ? (correct.slice(Math.floor(currentIdx/5)*5, (Math.floor(currentIdx/5)*5)+5).filter(c=>c).length * 20) 
      : (totalCorrect * 5);
  });

  let maskHeight = $derived(100 - completionRate);
  let currentPhoto = $derived(isStepFive ? setImages[Math.floor(currentIdx / 5)] : setImages[0]);

  function check() {
    if (answered[currentIdx] || !userInput.trim()) return;
    if (userInput.trim().toLowerCase() === targetAnswer.toLowerCase()) correct[currentIdx] = true;
    answered[currentIdx] = true;
  }

  function handleNext() {
    if (currentIdx < 19) { currentIdx++; userInput = ""; }
    else { if (setIdx < 4) onNext(); else onHome(); }
  }

  function goPrev() { if (currentIdx > 0) { currentIdx--; userInput = ""; } }
  
  function startReview() {
    const firstWrong = sessionWords.findIndex((_, i) => !correct[i]);
    if (firstWrong === -1) return;
    sessionWords.forEach((_, i) => { if (!correct[i]) answered[i] = false; });
    currentIdx = firstWrong; userInput = ""; showWrongNotes = false; isReviewMode = true;
  }
  
  function startInversion() {
    isInverted = !isInverted; 
    sessionWords = [...words].sort(() => Math.random() - 0.5);
    currentIdx = 0; userInput = "";
    answered = new Array(20).fill(false); correct = new Array(20).fill(false);
    showWrongNotes = false; isReviewMode = false;
    updateBank(isInverted ? !(setIdx % 2 === 0) : (setIdx % 2 === 0));
  }
</script>

<div class="test-page-container">
  <div class="ba-test-bg">
    <div class="bg-img-inner"></div>
    <div class="bg-overlay-trapezoid"></div>
    <div class="pattern-dots"></div>
  </div>

  <div class="test-content-inner">
    <div class="top-nav">
      <button class="home-btn" onclick={onHome}>🏠 LOBBY</button>
      <div class="progress-info">
        <span class="mode-text">{isReviewMode ? 'RE-TEST' : (isInverted ? 'INVERTED' : 'MISSION')}</span>
        <span class="set-text">SET {setIdx + 1} | {currentIdx + 1} / 20</span>
      </div>
    </div>

    <div class="split-layout">
      <div class="left-panel">
        {#if !showWrongNotes}
          <div class="question-box">
            <div class="type-badge">{isStepFive ? 'SYNONYM' : 'PRACTICE'}</div>
            
            {#if isStepFive}
              <div class="input-area">
                <div class="halo-id">{currentWord.word.charAt(0)}</div>
                <input 
                  bind:value={userInput} 
                  disabled={answered[currentIdx]} 
                  class:correct={answered[currentIdx] && correct[currentIdx]}
                  class:wrong={answered[currentIdx] && !correct[currentIdx]} 
                  placeholder="입력..."
                  onkeydown={(e) => e.key === 'Enter' && check()}
                />
              </div>
              <p class="hint-text"><span>HINT:</span> {currentWord.same.join(", ")}</p>
            {:else}
              <div class="example-box">
                <p class="example-text">
                  {currentWord.example1} 
                  <input 
                    bind:value={userInput} 
                    disabled={answered[currentIdx]} 
                    class="inline-input"
                    class:correct={answered[currentIdx] && correct[currentIdx]}
                    class:wrong={answered[currentIdx] && !correct[currentIdx]}
                    onkeydown={(e) => e.key === 'Enter' && check()}
                  /> 
                  {currentWord.example2}
                </p>
              </div>
              <div class="word-bank-container">
                <div class="word-grid-5x4">
                  {#each shuffledBank as word}
                    {@const oIdx = sessionWords.findIndex(w => w.word === word)}
                    <div class="word-item" 
                         class:is-correct={answered[oIdx] && correct[oIdx]} 
                         class:is-wrong={answered[oIdx] && !correct[oIdx]}>
                      {word}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            {#if answered[currentIdx]}
              <div class="result-display" class:is-success={correct[currentIdx]} class:is-fail={!correct[currentIdx]}>
                <div class="res-title">
                  {correct[currentIdx] ? '✓ MISSION COMPLETE' : '✗ LOG ERROR'}
                </div>
                <div class="res-content">
                  <p>정답: <strong>{targetAnswer}</strong></p>
                  <p>의미: {currentWord.mean}</p>
                </div>
              </div>
            {/if}

            <div class="control-area">
              <div class="nav-row">
                <button class="side-btn big" onclick={goPrev} disabled={currentIdx === 0}>PREV</button>
                <button class="check-btn big" onclick={check} disabled={answered[currentIdx]}>CONFIRM</button>
                <button class="side-btn next big active-trigger" 
                        onclick={handleNext} 
                        disabled={!answered[currentIdx]}
                        class:active={answered[currentIdx]}>
                  {currentIdx < 19 ? 'NEXT' : 'FINISH'}
                </button>
              </div>
            </div>
          </div>
        {:else}
          <div class="note-box">
            <div class="note-header"><h3>FAIL LOGS</h3></div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>WORD</th><th>MEANING</th><th>SYNONYM</th></tr>
                </thead>
                <tbody>
                  {#each wrongWords as w}
                    <tr>
                      <td class="word-cell">{w.word}</td>
                      <td class="mean-cell">{w.mean}</td>
                      <td>{w.same.join(", ")}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <button class="review-btn big" onclick={startReview}>RE-DEPLOY</button>
          </div>
        {/if}
      </div>

      <div class="right-panel">
        <div class="reward-container">
          <div class="gauge-section">
            <div class="gauge-label">
              <span>SYNC RATE</span>
              <span class="percent-text">{completionRate}%</span>
            </div>
            <div class="gauge-bar-bg">
              <div class="gauge-bar-fill" style="width: {completionRate}%"></div>
            </div>
          </div>

          <div class="puzzle-frame">
            <img src="/images/{rewardType}/{currentPhoto}" alt="Reward" />
            <div class="mask" style="height: {maskHeight}%;"></div>
            <div class="frame-border-deco"></div>
          </div>
        </div>
        
        {#if isAllAnswered && !showWrongNotes}
          <div class="final-actions">
            {#if wrongWords.length > 0}
              <button class="hud-btn highlight" onclick={() => showWrongNotes = true}>OPEN LOGS</button>
            {/if}
            <button class="hud-btn special" onclick={startInversion}>INVERT TYPE</button>
            <button class="hud-btn dark" onclick={onHome}>LOBBY</button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .test-page-container { position: relative; width: 100%; min-height: 100vh; overflow-x: hidden; }
  .ba-test-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background: #eef2f5; }
  .bg-img-inner { position: absolute; width: 100%; height: 100%; background: url('/tool/샬레내부.webp') no-repeat center; background-size: cover; opacity: 0.7; }
  .bg-overlay-trapezoid { position: absolute; top: 0; left: 0; width: 65%; height: 100%; background: rgba(255, 255, 255, 0.9); clip-path: polygon(0 0, 100% 0, 80% 100%, 0 100%); }
  .pattern-dots { position: absolute; width: 100%; height: 100%; background-image: radial-gradient(#00A3FF 0.5px, transparent 0.5px); background-size: 30px 30px; opacity: 0.15; }
  .test-content-inner { width: 100%; max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Pretendard', sans-serif; }
  .split-layout { display: grid; grid-template-columns: 1fr 420px; gap: 40px; align-items: start; }
  .question-box, .note-box { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(5px); padding: 35px; border-radius: 0 40px 0 40px; border: 3px solid #fff; box-shadow: 15px 15px 0px rgba(0, 163, 255, 0.05); }
  .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 4px solid #123456; padding-bottom: 15px; }
  .home-btn, .side-btn, .check-btn, .next, .review-btn, .hud-btn { font-weight: 900; cursor: pointer; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  .home-btn { background: #123456; color: white; border: none; padding: 8px 20px; border-radius: 6px; }
  .mode-text { color: #00A3FF; font-weight: 900; margin-right: 15px; font-size: 0.9rem; }
  .set-text { font-weight: 900; color: #123456; font-size: 1.1rem; }
  .input-area { display: flex; align-items: center; justify-content: center; margin-bottom: 25px; }
  .halo-id { width: 80px; height: 80px; background: #00A3FF; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 900; margin-right: 20px; }
  input { height: 80px; border: 3px solid #e2e8f0; border-radius: 15px; font-size: 1.6rem; padding: 0 20px; width: 300px; text-align: center; font-weight: 900; box-sizing: border-box; }
  input.correct { border-color: #00A3FF; color: #00A3FF; background: #f0faff; }
  input.wrong { border-color: #ff5e5e; color: #ff5e5e; background: #fff5f5; }
  .big { height: 85px !important; font-size: 1.4rem !important; border-radius: 0 20px 0 20px !important; }
  .nav-row { display: grid; grid-template-columns: 120px 1fr 140px; gap: 15px; }
  .side-btn { background: #e2e8f0; color: #4a5568; border: none; }
  .check-btn { background: #123456; color: white; border: none; box-shadow: 4px 4px 0px #00A3FF; }
  .next.active { background: #00A3FF; color: white; box-shadow: 4px 4px 0px #123456; }
  .word-bank-container { margin-top: 25px; margin-bottom: 50px; padding: 15px; background: rgba(241, 245, 249, 0.8); border-radius: 15px; }
  .word-grid-5x4 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .word-item { height: 50px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85rem; border: 1.5px solid #e2e8f0; transition: all 0.2s; }
  .word-item.is-correct { background: #00A3FF !important; color: white; border-color: #00A3FF; }
  .word-item.is-wrong { background: #ff5e5e !important; color: white; border-color: #ff5e5e; }
  .result-display { margin-top: 30px; margin-bottom: 50px; padding: 20px; border-radius: 15px; background: #f8fafc; border-left: 8px solid #123456; }
  .result-display.is-success { border-color: #00A3FF; background: #f0f9ff; border-left-color: #00A3FF; }
  .result-display.is-fail { border-color: #ff5e5e; background: #fff5f5; border-left-color: #ff5e5e; }
  .gauge-bar-bg { width: 100%; height: 16px; background: #e2e8f0; border-radius: 8px; overflow: hidden; border: 3px solid white; }
  .gauge-bar-fill { height: 100%; background: #00A3FF; transition: width 0.4s ease; }

  /* [수정] 사진 박스: 세로 높이 고정 해제 및 가로 고정 */
  .puzzle-frame { 
    position: relative; 
    width: 400px; 
    border-radius: 0 30px 0 30px; 
    overflow: hidden; 
    border: 6px solid white; 
    background: #fff; 
    box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
  }
  .puzzle-frame img { 
    width: 100%; 
    height: auto; /* 비율에 맞게 조정 */
    display: block;
  }
  .mask { position: absolute; top: 0; left: 0; width: 100%; background: #f3f7f9; transition: height 0.6s ease; z-index: 2; border-bottom: 3px solid #00A3FF; }

  .final-actions { margin-top: 25px; display: flex; flex-direction: column; gap: 12px; }
  .hud-btn { padding: 18px; border-radius: 0 15px 0 15px; border: none; font-size: 1rem; box-shadow: 4px 4px 0px rgba(0,0,0,0.1); }
  .hud-btn.special { background: #00A3FF; color: white; }
  .hud-btn.dark { background: #123456; color: white; }
  .hud-btn.highlight { background: #ff5e5e; color: white; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #123456; color: white; padding: 12px; text-align: left; }
  td { padding: 15px 12px; border-bottom: 1px solid #e2e8f0; background: white; }
  .word-cell { color: #00A3FF; font-weight: 900; }
  .review-btn { width: 100%; margin-top: 25px; background: #ff5e5e; color: white; border: none; box-shadow: 4px 4px 0px #123456; }
</style>