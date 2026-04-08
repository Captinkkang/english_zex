<script lang="ts">
  import { untrack } from 'svelte';
  import type { WordItem, RewardType } from './types';

  interface Props {
    setIdx: number;
    words: WordItem[];
    rewardType: RewardType;
    onHome: () => void;
    onNext: () => void;
    setImages: string[];
    initialTypes: boolean[]; 
  }

  let { setIdx, words, rewardType, onHome, onNext, setImages, initialTypes }: Props = $props();

  let currentIdx = $state(0);
  let userInput = $state("");
  let answered = $state<boolean[]>(new Array(20).fill(false));
  let correct = $state<boolean[]>(new Array(20).fill(false));
  let shuffledBank = $state<string[]>([]);
  let showWrongNotes = $state(false);
  let isReviewMode = $state(false);
  let isInverted = $state(false);
  let sessionWords = $state<WordItem[]>([...words]);

  // 이미지 경로 유효성 및 폴백
  function getImagePath(imgName: string) {
    if (!imgName || imgName === "") return '/tool/샬레내부.webp'; 
    return `/images/${rewardType}/${imgName}`;
  }

  function handleImageError(e: Event) {
    const target = e.target as HTMLImageElement;
    if (target.src !== window.location.origin + '/tool/샬레내부.webp') {
      target.src = '/tool/샬레내부.webp';
    }
  }

  $effect(() => {
    setIdx; 
    untrack(() => {
      currentIdx = 0; userInput = "";
      answered = new Array(20).fill(false);
      correct = new Array(20).fill(false);
      isInverted = false; showWrongNotes = false; isReviewMode = false;
      sessionWords = [...words];
      updateBank(initialTypes[setIdx]);
    });
  });

  function updateBank(isSynonymType: boolean) {
    if (!isSynonymType) {
      shuffledBank = [...sessionWords].map(w => w.word).sort(() => Math.random() - 0.5);
    } else {
      shuffledBank = [];
    }
  }

  let currentWord = $derived(sessionWords[currentIdx]);
  let isAllAnswered = $derived(answered.every(a => a));
  let isStepFive = $derived.by(() => {
    const defaultType = initialTypes[setIdx];
    return isInverted ? !defaultType : defaultType;
  });

  let targetAnswer = $derived(isStepFive ? currentWord.word : currentWord.trans_word);
  let wrongWords = $derived(sessionWords.filter((_, i) => answered[i] && !correct[i]));

  let completionRate = $derived.by(() => {
    if (isStepFive) {
      const blockIdx = Math.floor(currentIdx / 5);
      const blockCorrect = correct.slice(blockIdx * 5, (blockIdx * 5) + 5).filter(c => c).length;
      return blockCorrect * 20; 
    } else {
      return correct.filter(c => c).length * 5;
    }
  });

  let maskHeight = $derived(100 - completionRate);
  let currentPhoto = $derived.by(() => {
    if (!setImages || setImages.length === 0) return "";
    return isStepFive ? (setImages[Math.floor(currentIdx / 5)] || setImages[0]) : setImages[0];
  });

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

  function startInversion() {
    isInverted = !isInverted;
    sessionWords = [...words].sort(() => Math.random() - 0.5);
    currentIdx = 0; userInput = "";
    answered = new Array(20).fill(false); correct = new Array(20).fill(false);
    showWrongNotes = false; isReviewMode = false;
    updateBank(isStepFive);
  }

  function startReview() {
    const firstWrong = sessionWords.findIndex((_, i) => !correct[i]);
    if (firstWrong === -1) return;
    sessionWords.forEach((_, i) => { if (!correct[i]) answered[i] = false; });
    currentIdx = firstWrong; userInput = ""; showWrongNotes = false; isReviewMode = true;
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
            <div class="type-badge" class:is-syn={isStepFive}>{isStepFive ? 'SYNONYM' : 'PRACTICE'}</div>
            
            <div class="input-area-horizontal">
              {#if isStepFive}
                <div class="halo-id">{currentWord.word.charAt(0)}</div>
                <input
                  bind:value={userInput}
                  disabled={answered[currentIdx]}
                  class:correct={answered[currentIdx] && correct[currentIdx]}
                  class:wrong={answered[currentIdx] && !correct[currentIdx]}
                  placeholder="입력..."
                  onkeydown={(e) => e.key === 'Enter' && check()}
                />
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
              {/if}
            </div>

            {#if isStepFive}
              <p class="hint-text"><span>HINT:</span> {currentWord.same.join(", ")}</p>
            {:else}
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
                  <p>정답: <strong>{targetAnswer}</strong> | 의미: {currentWord.mean}</p>
                </div>
              </div>
            {/if}

            <div class="nav-row">
              <button class="ba-btn side-btn big" onclick={goPrev} disabled={currentIdx === 0}>PREV</button>
              <button class="ba-btn check-btn big" onclick={check} disabled={answered[currentIdx]}>CONFIRM</button>
              <button class="ba-btn next-btn big"
                      onclick={handleNext}
                      disabled={!answered[currentIdx]}
                      class:active={answered[currentIdx]}>
                {currentIdx < 19 ? 'NEXT' : 'FINISH'}
              </button>
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
            <button class="ba-btn log-btn big" style="width: 100%; margin-top: 25px;" onclick={startReview}>RE-DEPLOY</button>
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
            <img src={getImagePath(currentPhoto)} alt="Reward" onerror={handleImageError} />
            <div class="mask" style="height: {maskHeight}%;"></div>
            <div class="frame-border-deco"></div>
          </div>
        </div>
        
        {#if isAllAnswered && !showWrongNotes}
          <div class="final-actions">
            {#if wrongWords.length > 0}
              <button class="ba-btn log-btn big" onclick={() => showWrongNotes = true}>OPEN LOGS</button>
            {/if}
            <button class="ba-btn special-btn big" onclick={startInversion}>INVERT TYPE</button>
            <button class="ba-btn lobby-btn big" onclick={onHome}>LOBBY</button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* 레이아웃 및 배경 */
  .test-page-container { position: relative; width: 100%; min-height: 100vh; overflow-x: hidden; }
  .ba-test-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background: #eef2f5; }
  .bg-img-inner { position: absolute; width: 100%; height: 100%; background: url('/tool/샬레내부.webp') no-repeat center; background-size: cover; opacity: 0.7; }
  .bg-overlay-trapezoid { position: absolute; top: 0; left: 0; width: 65%; height: 100%; background: rgba(255, 255, 255, 0.95); clip-path: polygon(0 0, 100% 0, 80% 100%, 0 100%); }
  .pattern-dots { position: absolute; width: 100%; height: 100%; background-image: radial-gradient(#00A3FF 0.5px, transparent 0.5px); background-size: 30px 30px; opacity: 0.15; }
  .test-content-inner { width: 100%; max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Pretendard', sans-serif; }
  .split-layout { display: grid; grid-template-columns: 1fr 420px; gap: 40px; align-items: start; }
  
  .question-box, .note-box { background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(10px); padding: 40px; border-radius: 0 45px 0 45px; border: 3px solid #fff; box-shadow: 20px 20px 0px rgba(0, 163, 255, 0.1); }

  /* 인풋 디자인 (이전 코드와 동일 수치) */
  .input-area-horizontal { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 25px; min-height: 80px; }
  .halo-id { width: 80px; height: 80px; background: #00A3FF; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 900; flex-shrink: 0; }
  input { height: 80px; border: 3.5px solid #e2e8f0; border-radius: 15px; font-size: 1.8rem; padding: 0 25px; width: 320px; text-align: center; font-weight: 900; box-sizing: border-box; transition: border-color 0.2s; }
  input:focus { border-color: #00A3FF; outline: none; }
  input.correct { border-color: #00A3FF; color: #00A3FF; background: #f0faff; }
  input.wrong { border-color: #f43f5e; color: #f43f5e; background: #fff5f5; }
  .inline-input { height: 50px; width: 200px; font-size: 1.3rem; margin: 0 10px; border-width: 2px; }

  /* [강화] App.svelte DEPLOY 스타일 버튼 (이전 코드와 완전 동일) */
  .ba-btn { 
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    font-weight: 900;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 4px 28px 4px 28px;
    position: relative;
    letter-spacing: 1px;
    border-bottom: 6px solid rgba(0, 0, 0, 0.2);
  }

  .ba-btn.big { 
    height: 95px; 
    font-size: 1.7rem; 
    padding: 0 45px;
  }

  .check-btn, .lobby-btn { background: #123456; color: #FFFFFF; box-shadow: 8px 8px 0px #00A3FF; }
  .side-btn { background: #475569; color: #FFFFFF; box-shadow: 8px 8px 0px #94a3b8; }
  .next-btn.active, .special-btn { background: #00A3FF; color: #FFFFFF; box-shadow: 8px 8px 0px #123456; }
  .log-btn { background: #f43f5e; color: #FFFFFF; box-shadow: 8px 8px 0px #123456; }

  .ba-btn:hover:not(:disabled) {
    transform: translate(-4px, -4px);
    filter: brightness(1.1);
    box-shadow: 12px 12px 0px rgba(0, 0, 0, 0.15);
  }

  .ba-btn:active:not(:disabled) {
    transform: translate(6px, 6px);
    box-shadow: 0px 0px 0px transparent;
    border-bottom: none;
  }

  .ba-btn:disabled { 
    opacity: 0.3; 
    cursor: not-allowed; 
    box-shadow: none !important; 
    transform: none !important; 
    border-bottom: none;
  }

  /* 네비게이션 및 레이아웃 요소 */
  .nav-row { display: grid; grid-template-columns: 180px 1fr 200px; gap: 25px; margin-top: 45px; }
  .final-actions { margin-top: 35px; display: flex; flex-direction: column; gap: 22px; }

  .puzzle-frame { position: relative; width: 100%; min-height: 300px; background: #f1f5f9; border-radius: 0 35px 0 35px; overflow: hidden; border: 10px solid white; box-shadow: 0 15px 40px rgba(0,0,0,0.2); }
  .puzzle-frame img { width: 100%; height: auto; display: block; object-fit: cover; }
  .mask { position: absolute; top: 0; left: 0; width: 100%; background: #f3f7f9; transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1); z-index: 2; border-bottom: 5px solid #00A3FF; }
  
  .gauge-section { margin-bottom: 20px; }
  .gauge-label { display: flex; justify-content: space-between; font-weight: 900; color: #123456; margin-bottom: 8px; }
  .gauge-bar-bg { width: 100%; height: 16px; background: #e2e8f0; border-radius: 8px; overflow: hidden; border: 3px solid white; }
  .gauge-bar-fill { height: 100%; background: #00A3FF; transition: width 0.4s ease; }

  .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px; border-bottom: 5px solid #123456; padding-bottom: 15px; }
  .home-btn { background: #123456; color: white; border: none; padding: 12px 25px; border-radius: 10px; font-weight: 900; cursor: pointer; }
  .mode-text { color: #00A3FF; font-weight: 900; margin-right: 15px; }
  .type-badge { display: inline-block; background: #94a3b8; color: white; padding: 7px 18px; border-radius: 7px; font-weight: 900; margin-bottom: 25px; }
  .type-badge.is-syn { background: #00A3FF; }
  .word-grid-5x4 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 25px 0; }
  .word-item { height: 50px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #e2e8f0; font-size: 0.9rem; }
  .word-item.is-correct { background: #00A3FF !important; color: white; border-color: #00A3FF; }
  .word-item.is-wrong { background: #f43f5e !important; color: white; border-color: #f43f5e; }
  .result-display { margin-top: 30px; padding: 25px; border-radius: 15px; border-left: 12px solid #123456; background: #f8fafc; }
  .result-display.is-success { border-color: #00A3FF; background: #f0f9ff; }
  .result-display.is-fail { border-color: #f43f5e; background: #fff5f5; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
  .word-cell { font-weight: 900; color: #00A3FF; }
</style>