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

  $effect(() => {
    if (setIdx !== undefined) {
      currentIdx = 0;
      userInput = "";
      answered = new Array(20).fill(false);
      correct = new Array(20).fill(false);
      shuffledBank = [...words].map(w => w.word).sort(() => Math.random() - 0.5);
    }
  });

  let currentWord = $derived(words[currentIdx]);
  let isAllAnswered = $derived(answered.every(a => a));
  let isStepFive = $derived(setIdx % 2 === 0); 
  let targetAnswer = $derived(isStepFive ? currentWord.word : currentWord.trans_word);

  let completionRate = $derived.by(() => {
    if (isStepFive) {
      const groupIdx = Math.floor(currentIdx / 5);
      const count = correct.slice(groupIdx * 5, (groupIdx + 1) * 5).filter(c => c).length;
      return count * 20;
    } else {
      const count = correct.filter(c => c).length;
      return count * 5;
    }
  });

  let maskHeight = $derived(100 - completionRate);
  let currentPhoto = $derived(isStepFive ? setImages[Math.floor(currentIdx / 5)] : setImages[0]);

  function check() {
    if (answered[currentIdx] || !userInput.trim()) return;
    if (userInput.trim().toLowerCase() === targetAnswer.toLowerCase()) {
      correct[currentIdx] = true;
    }
    answered[currentIdx] = true;
  }

  function goNext() { if (currentIdx < 19) { currentIdx++; userInput = ""; } }
  function goPrev() { if (currentIdx > 0) { currentIdx--; userInput = ""; } }
</script>

<div class="test-container">
  <div class="top-nav">
    <button class="home-btn" onclick={onHome}>🏠 HOME</button>
    <div class="progress-info">
      SET {setIdx + 1} <span class="divider">|</span> <span class="counter">{currentIdx + 1} / 20</span>
    </div>
  </div>

  <div class="main-layout">
    <div class="question-box">
      {#if isStepFive}
        <div class="input-area">
          <span class="initial-hint">{currentWord.word.charAt(0)}</span>
          <input 
            bind:value={userInput} 
            disabled={answered[currentIdx]} 
            class:correct={answered[currentIdx] && correct[currentIdx]}
            class:wrong={answered[currentIdx] && !correct[currentIdx]} 
            onkeydown={(e) => e.key === 'Enter' && check()}
            placeholder="단어 입력"
          />
        </div>
        <p class="sub-text">동의어: {currentWord.same.join(", ")}</p>
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
        <div class="word-grid">
          {#each shuffledBank as word}
            {@const originalIdx = words.findIndex(w => w.word === word)}
            <div class="word-item" 
                 class:is-correct={answered[originalIdx] && correct[originalIdx]}
                 class:is-wrong={answered[originalIdx] && !correct[originalIdx]}>
              {word}
            </div>
          {/each}
        </div>
      {/if}
      
      {#if answered[currentIdx]}
        <div class="answer-reveal" class:text-success={correct[currentIdx]} class:text-danger={!correct[currentIdx]}>
          {correct[currentIdx] ? '정답입니다!' : '오답입니다.'} 정답: <strong>{targetAnswer}</strong>
        </div>
      {/if}

      <button class="check-btn" onclick={check} disabled={answered[currentIdx]}>확인</button>
    </div>

    <div class="nav-btns">
      <button class="nav-btn" onclick={goPrev} disabled={currentIdx === 0}>이전</button>
      <button class="nav-btn next" onclick={goNext} disabled={!answered[currentIdx] || currentIdx === 19}>다음</button>
    </div>

    <div class="reward-section">
      <div class="completion-badge">완성률: {completionRate}%</div>
      <div class="puzzle-container">
        <img src="/images/{rewardType}/{currentPhoto}" alt="Reward" />
        <div class="mask" style="height: {maskHeight}%;"></div>
      </div>
    </div>
  </div>

  {#if isAllAnswered}
    <div class="complete-area">
      <button class="next-set-btn" onclick={onNext}>
        {setIdx < 4 ? '다음 세트 진행 ➔' : '모든 테스트 완료'}
      </button>
    </div>
  {/if}
</div>

<style>
  /* 기본 레이아웃 및 정렬 유지 */
  .test-container { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
  .top-nav { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 500px; margin-bottom: 20px; }
  .main-layout { display: flex; flex-direction: column; align-items: center; width: 100%; gap: 20px; }
  .question-box, .reward-section { width: 100%; max-width: 500px; box-sizing: border-box; }
  .question-box { background: white; padding: 30px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center; }

  /* 색상 피드백 스타일 (중요!) */
  input.correct { background-color: #e8f5e9 !important; border-color: #2ecc71 !important; color: #27ae60 !important; }
  input.wrong { background-color: #fff5f5 !important; border-color: #ff7675 !important; color: #d63031 !important; }
  
  .answer-reveal { margin-top: 15px; font-size: 1rem; font-weight: 500; }
  .text-success { color: #27ae60; } /* 초록색 */
  .text-danger { color: #eb4d4b; }  /* 빨간색 */

  /* 나머지 스타일 유지 */
  .input-area { display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 15px; }
  input { padding: 12px; border: 2px solid #eef0f2; border-radius: 12px; font-size: 1.1rem; width: 180px; text-align: center; transition: all 0.2s; }
  .inline-input { width: 140px; border-top: none; border-left: none; border-right: none; border-radius: 0; }
  
  .word-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 20px; }
  .word-item { padding: 8px 4px; font-size: 0.8rem; background: #f1f2f6; border-radius: 8px; border: 1px solid #dfe4ea; color: #7f8c8d; }
  .word-item.is-correct { background: #2ecc71 !important; color: white !important; border-color: #27ae60; }
  .word-item.is-wrong { background: #ff7675 !important; color: white !important; border-color: #d63031; }

  .puzzle-container { position: relative; width: 100%; aspect-ratio: 4 / 3; background: #2d3436; border-radius: 20px; overflow: hidden; border: 5px solid white; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
  .puzzle-container img { width: 100%; height: 100%; object-fit: contain; }
  .mask { position: absolute; top: 0; left: 0; width: 100%; background: #f8f9fa; transition: height 0.6s ease-out; }
  
  .completion-badge { background: #ebfbee; color: #2ecc71; padding: 6px 16px; border-radius: 20px; font-weight: 800; margin-bottom: 10px; border: 1.5px solid #2ecc71; display: inline-block; }
  
  button { cursor: pointer; transition: transform 0.1s, background 0.2s; font-weight: bold; border: none; border-radius: 10px; padding: 10px; }
  button:active { transform: scale(0.96); }
  .check-btn { width: 100%; padding: 15px; margin-top: 20px; background: #2f3542; color: white; }
  .nav-btn { padding: 10px 30px; background: #dfe4ea; color: #2f3542; }
  .nav-btn.next { background: #0984e3; color: white; }
  .next-set-btn { background: #00b894; color: white; padding: 18px 45px; font-size: 1.2rem; }
  
  .initial-hint { font-size: 1.8rem; color: #0984e3; font-weight: 800; }
  .counter { color: #0984e3; }
</style>