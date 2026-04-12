<script lang="ts">
  import { untrack } from 'svelte';
  import type { WordItem, RewardType } from './types';

  export interface Props {
    setIdx: number;
    words: any[]; 
    rewardType: RewardType;
    onHome: () => void;
    onNext: () => void;
    setImages: string[];
    initialTypes: boolean[]; 
    testMode?: 'syn_ex' | 'spelling' | 'meaning' | 'meaning_arr';
  }

  let { 
    setIdx, words, rewardType, onHome, onNext, setImages, initialTypes, 
    testMode = 'syn_ex' 
  }: Props = $props();

  let currentIdx = $state(0);
  let userInput = $state("");
  let answered = $state<boolean[]>([]);
  let correct = $state<boolean[]>([]);
  let showWrongNotes = $state(false);

  // 데이터 변경 시 상태 초기화 (20개 고정 해제)
  $effect(() => {
    words;
    untrack(() => {
      currentIdx = 0;
      userInput = "";
      answered = new Array(words.length).fill(false);
      correct = new Array(words.length).fill(false);
      showWrongNotes = false;
    });
  });

  // 이미지 경로 및 에러 핸들링 (유효한 이미지 찾기)
  let imgRetryCount = $state(0);
  function getImagePath(imgName: string) {
    if (!imgName) return '/tool/샬레내부.webp';
    return `/images/${rewardType}/${imgName}`;
  }

  function handleImageError(e: Event) {
    const target = e.target as HTMLImageElement;
    if (imgRetryCount < setImages.length) {
      target.src = getImagePath(setImages[imgRetryCount]);
      imgRetryCount++;
    } else {
      target.src = '/tool/샬레내부.webp';
    }
  }

  let currentWord = $derived(words[currentIdx]);
  let isAllAnswered = $derived(answered.length > 0 && answered.every(a => a));
  let isStepFive = $derived(testMode === 'meaning_arr' ? true : initialTypes[setIdx]);
  
  // 정답 타겟 결정 (개인 단어장의 경우 배열 정답 지원)
  let targetAnswer = $derived.by(() => {
    if (testMode === 'meaning_arr') return currentWord.same; 
    return isStepFive ? currentWord.word : currentWord.trans_word;
  });

  // 게이지 계산
  let completionRate = $derived.by(() => {
    if (words.length === 0) return 0;
    const correctCount = correct.filter(c => c).length;
    return Math.floor((correctCount / words.length) * 100);
  });

  function check() {
    if (answered[currentIdx] || !userInput.trim()) return;
    const input = userInput.trim().toLowerCase();
    
    let isCorrect = false;
    if (Array.isArray(targetAnswer)) {
      isCorrect = targetAnswer.some(a => a.toLowerCase() === input);
    } else {
      isCorrect = input === targetAnswer.toLowerCase();
    }

    if (isCorrect) correct[currentIdx] = true;
    answered[currentIdx] = true;
  }

  function handleNextBtn() {
    if (currentIdx < words.length - 1) {
      currentIdx++;
      userInput = "";
      imgRetryCount = 0;
    } else {
      onNext();
    }
  }

  function goPrev() {
    if (currentIdx > 0) { currentIdx--; userInput = ""; }
  }

  function startReview() {
    answered = answered.map((a, i) => correct[i] ? true : false);
    currentIdx = answered.findIndex(a => !a);
    if (currentIdx === -1) currentIdx = 0;
    showWrongNotes = false;
  }
</script>

<div class="test-page-container">
  <div class="ba-test-bg">
    <div class="bg-img-inner"></div>
    <div class="bg-overlay-trapezoid"></div>
  </div>

  <div class="test-content-inner">
    <div class="top-nav">
      <button class="home-btn" onclick={onHome}>🏠 LOBBY</button>
      <div class="progress-info">
        <span>SET {setIdx + 1} | {currentIdx + 1} / {words.length}</span>
      </div>
    </div>

    <div class="split-layout">
      <div class="left-panel">
        {#if !showWrongNotes}
          <div class="question-box">
            <div class="type-badge" class:is-syn={isStepFive}>
              {testMode === 'meaning_arr' ? 'PRIVATE' : (isStepFive ? 'SPELLING' : 'MEANING')}
            </div>
            
            <div class="input-area-horizontal">
              {#if testMode === 'meaning_arr'}
                <h2 class="q-word" style="font-size: 3.5rem; color: #123456; font-weight: 900; margin-right: 20px;">{currentWord.word}</h2>
              {:else if isStepFive}
                <div class="halo-id">{currentWord.word[0]}</div>
              {/if}

              <input
                bind:value={userInput}
                disabled={answered[currentIdx]}
                class:correct={answered[currentIdx] && correct[currentIdx]}
                class:wrong={answered[currentIdx] && !correct[currentIdx]}
                onkeydown={(e) => e.key === 'Enter' && check()}
                placeholder="입력하세요..."
              />
            </div>

            {#if answered[currentIdx]}
              <div class="res-msg" style="text-align: center; font-weight: 900; margin: 10px 0; font-size: 1.2rem; color: {correct[currentIdx] ? '#00A3FF' : '#f43f5e'}">
                {correct[currentIdx] ? '✓ CORRECT' : '✗ FAILED'} - {Array.isArray(targetAnswer) ? targetAnswer.join(', ') : targetAnswer}
              </div>
            {/if}

            <div class="nav-row" style="display: flex; gap: 15px; margin-top: 30px;">
              <button class="ba-btn big" style="background: #eee; flex: 0.4;" onclick={goPrev} disabled={currentIdx === 0}>PREV</button>
              <button class="ba-btn big check-btn" style="flex: 1;" onclick={check} disabled={answered[currentIdx]}>CONFIRM</button>
              <button class="ba-btn big next-btn active" style="flex: 1;" onclick={handleNextBtn} disabled={!answered[currentIdx]}>
                {currentIdx < words.length - 1 ? 'NEXT' : 'FINISH'}
              </button>
            </div>
          </div>
        {:else}
          <div class="note-box">
             <h3 style="color: #123456; font-weight: 900; border-bottom: 3px solid #00A3FF; padding-bottom: 10px;">MISSION FAIL LOG</h3>
             <table>
               <thead>
                 <tr><th>WORD</th><th>ANSWER</th><th>RESULT</th></tr>
               </thead>
               <tbody>
                 {#each words as w, i}
                   <tr>
                     <td class="word-cell">{w.word}</td>
                     <td>{Array.isArray(w.same) ? w.same.join(', ') : w.trans_word}</td>
                     <td style="color:{correct[i] ? '#00A3FF':'#f43f5e'}; font-weight: 900;">{correct[i] ? 'PASS' : 'FAIL'}</td>
                   </tr>
                 {/each}
               </tbody>
             </table>
             <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="ba-btn big next-btn active" style="flex: 1;" onclick={startReview}>RE-TEST (WRONG)</button>
                <button class="ba-btn big" style="flex: 1; background: #123456; color: white;" onclick={() => showWrongNotes = false}>BACK</button>
             </div>
          </div>
        {/if}
      </div>

      <div class="right-panel">
        <div class="gauge-wrap" style="margin-bottom: 20px;">
          <div class="gauge-label" style="font-weight: 900; color: #123456; margin-bottom: 8px;">
            SYNC RATE <span style="color: #00A3FF;">{completionRate}%</span>
          </div>
          <div class="gauge-bar-bg">
            <div class="gauge-bar-fill" style="width: {completionRate}%"></div>
          </div>
        </div>

        <div class="puzzle-frame">
          <img src={getImagePath(setImages[0])} alt="Reward" onerror={handleImageError} />
          <div class="mask" style="height: {100 - completionRate}%;"></div>
        </div>

        {#if isAllAnswered}
           <div class="final-btns" style="display: flex; flex-direction: column; gap: 12px; margin-top: 25px;">
              <button class="ba-btn big check-btn" onclick={() => showWrongNotes = true}>VIEW FAIL LOG</button>
              <button class="ba-btn big" style="background: #eee;" onclick={onHome}>RETURN TO LOBBY</button>
           </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* [기존 레이아웃 구조 유지] */
  .test-page-container { position: relative; width: 100%; min-height: 100vh; overflow-x: hidden; }
  .ba-test-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background: #eef2f5; }
  .bg-img-inner { position: absolute; width: 100%; height: 100%; background: url('/tool/샬레내부.webp') no-repeat center; background-size: cover; opacity: 0.7; }
  .bg-overlay-trapezoid { position: absolute; top: 0; left: 0; width: 65%; height: 100%; background: rgba(255, 255, 255, 0.95); clip-path: polygon(0 0, 100% 0, 80% 100%, 0 100%); }
  
  .test-content-inner { 
    width: 100%; 
    max-width: 1200px; 
    margin: 0 auto; 
    padding: 40px 20px; 
    font-family: 'Pretendard', sans-serif; 
    box-sizing: border-box; 
  }

  .split-layout { 
    display: grid; 
    grid-template-columns: minmax(0, 1fr) 420px; 
    gap: 40px; 
    align-items: start; 
  }
  
  .question-box, .note-box { 
    background: rgba(255, 255, 255, 0.98); 
    backdrop-filter: blur(10px); 
    padding: 40px; 
    border-radius: 0 45px 0 45px; 
    border: 3px solid #fff; 
    box-shadow: 20px 20px 0px rgba(0, 163, 255, 0.1); 
    box-sizing: border-box;
    overflow: hidden; /* 내부 요소가 박스를 뚫지 못하게 함 */
  }

  /* [수정] 입력 영역: 단어가 길어지면 인풋이 다음 줄로 내려가거나 유연하게 대응 */
  .input-area-horizontal { 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    flex-wrap: wrap; /* 핵심: 공간 부족 시 자동 줄바꿈 허용 */
    gap: 15px; 
    margin-bottom: 25px; 
    min-height: 80px; 
    width: 100%;
  }

  /* [수정] 긴 단어(q-word) 처리: 너무 길면 폰트 크기 축소 */
  .q-word { 
    font-size: clamp(1.8rem, 5vw, 3.5rem) !important; /* 최소 1.8rem ~ 최대 3.5rem 사이에서 자동 조절 */
    color: #123456; 
    font-weight: 900; 
    margin: 0;
    white-space: nowrap; /* 단어 중간 끊김 방지 */
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis; /* 혹시라도 넘치면 ... 처리 */
  }

  .halo-id { 
    flex-shrink: 0; /* 모양 찌그러짐 방지 */
    width: 80px; height: 80px; background: #00A3FF; color: white; border-radius: 12px; 
    display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 900; 
  }
  
  /* [수정] 인풋 스타일: max-width를 유지하되 유연하게 조정 */
  input { 
    height: 80px; 
    border: 3.5px solid #e2e8f0; 
    border-radius: 15px; 
    font-size: 1.8rem; 
    padding: 0 25px; 
    width: 100%; 
    max-width: 320px; 
    text-align: center; 
    font-weight: 900; 
    transition: all 0.3s; 
    box-sizing: border-box;
  }
  
  /* [기존 스타일 유지] */
  input:focus { border-color: #00A3FF; outline: none; }
  input.correct { border-color: #00A3FF; color: #00A3FF; background: #f0faff; }
  input.wrong { border-color: #f43f5e; color: #f43f5e; background: #fff5f5; }
  
  .ba-btn { display: flex; justify-content: center; align-items: center; border: none; font-weight: 900; cursor: pointer; border-radius: 4px 28px 4px 28px; position: relative; border-bottom: 6px solid rgba(0, 0, 0, 0.2); transition: all 0.15s; }
  .ba-btn:active { transform: translateY(3px); border-bottom-width: 2px; }
  .ba-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); }
  .ba-btn.big { height: 80px; font-size: 1.5rem; }
  .check-btn { background: #123456; color: white; box-shadow: 8px 8px 0px rgba(0, 163, 255, 0.2); }
  .next-btn.active { background: #00A3FF; color: white; box-shadow: 8px 8px 0px rgba(18, 52, 86, 0.2); }
  
  .puzzle-frame { position: relative; width: 100%; background: #f1f5f9; border-radius: 0 35px 0 35px; overflow: hidden; border: 10px solid white; box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
  .puzzle-frame img { width: 100%; height: auto; display: block; }
  .mask { position: absolute; top: 0; left: 0; width: 100%; background: #f3f7f9; transition: height 0.6s ease; z-index: 2; border-bottom: 5px solid #00A3FF; }
  
  .gauge-bar-bg { width: 100%; height: 16px; background: #e2e8f0; border-radius: 8px; overflow: hidden; border: 3px solid white; }
  .gauge-bar-fill { height: 100%; background: #00A3FF; transition: width 0.4s ease; }
  
  .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
  .home-btn { padding: 10px 20px; background: white; border: 2px solid #123456; border-radius: 8px; font-weight: 900; color: #123456; cursor: pointer; }
  .progress-info { background: #123456; color: white; padding: 10px 25px; border-radius: 20px; font-weight: 900; }

  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
  th { font-size: 0.8rem; color: #666; }
  .word-cell { font-weight: 900; color: #00A3FF; }
</style>