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

  // --- 상태 관리 (세트 변경 시 초기화 필요) ---
  let currentIdx = $state(0);
  let userInput = $state("");
  let answered = $state<boolean[]>(new Array(20).fill(false));
  let correct = $state<boolean[]>(new Array(20).fill(false));

  // 중요: setIdx가 바뀌면 모든 내부 상태를 초기화 (5번, 7번, 8번, 11번 해결)
  $effect(() => {
    if (setIdx !== undefined) {
      currentIdx = 0;
      userInput = "";
      answered = new Array(20).fill(false);
      correct = new Array(20).fill(false);
    }
  });

  // --- 파생 상태 ---
  let currentWord = $derived(words[currentIdx]);
  let isAllAnswered = $derived(answered.every(a => a));
  let wordBank = $derived([...words].sort((a, b) => a.word.localeCompare(b.word)));
  let isStepFive = $derived(setIdx % 2 === 0); 
  let targetAnswer = $derived(isStepFive ? currentWord.word : currentWord.trans_word);

  // 마스크 계산
  let maskHeight = $derived.by(() => {
    if (isStepFive) {
      const groupIdx = Math.floor(currentIdx / 5);
      const count = correct.slice(groupIdx * 5, (groupIdx + 1) * 5).filter(c => c).length;
      return 100 - (count * 20);
    } else {
      const count = correct.filter(c => c).length;
      return 100 - (count * 5);
    }
  });

  let currentPhoto = $derived(isStepFive ? setImages[Math.floor(currentIdx / 5)] : setImages[0]);

  function check() {
    if (answered[currentIdx] || !userInput.trim()) return;
    if (userInput.trim().toLowerCase() === targetAnswer.toLowerCase()) {
      correct[currentIdx] = true;
    }
    answered[currentIdx] = true;
  }

  function goNext() {
    if (currentIdx < 19) {
      currentIdx++;
      userInput = "";
    }
  }

  function goPrev() {
    if (currentIdx > 0) {
      currentIdx--;
      userInput = "";
    }
  }
</script>

<div class="test-container">
  <div class="top-nav">
    <button class="home-btn" onclick={onHome}>🏠 메인으로</button>
    <div class="progress-info">
      세트 {setIdx + 1} ({isStepFive ? '동의어' : '예문'}) | {currentIdx + 1} / 20
    </div>
  </div>

  <div class="question-section">
    <div class="question-box">
      {#if isStepFive}
        <div class="input-group">
          <span class="hint">{currentWord.word.charAt(0)}{"_".repeat(currentWord.word.length - 1)}</span>
          <input 
            bind:value={userInput} 
            disabled={answered[currentIdx]} 
            class:correct={answered[currentIdx] && correct[currentIdx]}
            class:wrong={answered[currentIdx] && !correct[currentIdx]} 
            onkeydown={(e) => e.key === 'Enter' && check()}
          />
        </div>
        <p class="sub-text">동의어: {currentWord.same.join(", ")}</p>
      {:else}
        <div class="example-box">
          <p>
            {currentWord.example1} 
            <input 
              bind:value={userInput} 
              disabled={answered[currentIdx]} 
              class="inline"
              class:correct={answered[currentIdx] && correct[currentIdx]}
              class:wrong={answered[currentIdx] && !correct[currentIdx]}
              onkeydown={(e) => e.key === 'Enter' && check()}
            /> 
            {currentWord.example2}
          </p>
        </div>
        <div class="word-grid">
          {#each wordBank as w}
            <div class="word-item">{w.word}</div>
          {/each}
        </div>
      {/if}
      
      {#if answered[currentIdx] && !correct[currentIdx]}
        <div class="answer-reveal">정답: {targetAnswer}</div>
      {/if}

      <div class="action-btns">
        <button class="check-btn" onclick={check} disabled={answered[currentIdx]}>확인</button>
      </div>
    </div>

    <div class="nav-btns">
      <button onclick={goPrev} disabled={currentIdx === 0}>이전</button>
      <button onclick={goNext} disabled={!answered[currentIdx] || currentIdx === 19}>다음</button>
    </div>
  </div>

  <div class="reward-box">
    <div class="puzzle-container">
      <img src="/images/{rewardType}/{currentPhoto}" alt="Reward" />
      <div class="mask" style="height: {maskHeight}%;"></div>
    </div>
  </div>

  {#if isAllAnswered}
    <div class="complete-area">
      {#if setIdx < 4}
        <button class="next-set-btn" onclick={onNext}>다음 세트로 진행하기 ➔</button>
      {:else}
        <div class="final-msg">모든 테스트 완료!</div>
        <button onclick={onHome}>결과 확인 및 종료</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .test-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%; }
  
  /* 네비게이션 */
  .top-nav { display: flex; justify-content: space-between; width: 100%; max-width: 500px; align-items: center; }
  .home-btn { background: #eee; color: #333; padding: 5px 12px; font-size: 0.9rem; }
  .progress-info { font-weight: bold; color: #666; }

  /* 문제 박스 (가운데 정렬) */
  .question-section { text-align: center; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  .question-box { background: white; padding: 1.5rem; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); width: 100%; max-width: 500px; }
  
  /* 인풋 컬러 (2번) */
  input { padding: 10px; border: 2px solid #ddd; border-radius: 8px; text-align: center; font-size: 1.1rem; }
  input.correct { background-color: #e8f5e9; border-color: #4caf50; }
  input.wrong { background-color: #ffebee; border-color: #f44336; }
  input.inline { width: 120px; border-top: none; border-left: none; border-right: none; border-radius: 0; }

  /* 단어 그리드 (10번) */
  .word-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-top: 1rem; border-top: 1px dashed #eee; padding-top: 1rem; }
  .word-item { background: #f8f9fa; border: 1px solid #e9ecef; padding: 4px; font-size: 0.8rem; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .answer-reveal { color: #f44336; font-weight: bold; margin-top: 10px; }
  .nav-btns { display: flex; gap: 10px; }
  .nav-btns button { padding: 8px 20px; background: #666; }

  /* 사진 및 마스크 */
  .puzzle-container { position: relative; width: 400px; height: 300px; overflow: hidden; background: #eee; border-radius: 10px; border: 3px solid white; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
  .puzzle-container img { width: 100%; height: 100%; object-fit: cover; }
  .mask { position: absolute; top: 0; left: 0; width: 100%; background: #fdfdfd; transition: height 0.5s ease-out; }

  /* 완료 버튼 */
  .complete-area { margin-top: 10px; animation: slideUp 0.4s ease-out; }
  .next-set-btn { background: #00b894; padding: 15px 30px; font-size: 1.2rem; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>