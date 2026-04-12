<script lang="ts">
  import WordTest from '../lib/WordTest.svelte';
  import PersonalEditor from '../lib/PersonalEditors.svelte'; 
  import AuthModal from '../lib/AuthModal.svelte';
  import type { WordItem, RewardType, PersonalWord } from '../lib/types';
  import { imageAssets } from '../lib/imageAssets';
  import rawData from '../lib/data.json';

  // --- 상태 관리 (원본 유지) ---
  let step = $state<'main' | 'book' | 'plan' | 'test' | 'auth' | 'p_edit'>('main');
  let selectedType = $state<RewardType>('A');
  
  let shuffledSets = $state<WordItem[][]>([]);
  let sessionImages = $state<string[][]>([]);
  let currentSetIdx = $state(0);
  let initialTypes = $state<boolean[]>([true, false, true, false, true]);
  let testMode = $state<'syn_ex' | 'meaning_arr'>('syn_ex');

  let authTarget = $state<'manage' | 'test'>('manage');
  let tempId = $state("");
  let tempPw = $state("");
  let personalWords = $state<PersonalWord[]>([]);

  const vocabularyList = rawData as WordItem[];

  function shuffle<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
  }

  // --- 기존 로직 (원본 유지) ---
  function goBookSelect(type: RewardType) {
    selectedType = type;
    step = 'book';
  }

  function selectBook(bookId: number) {
    if (bookId === 1) {
      step = 'plan';
    } else if (bookId === 2) {
      authTarget = 'manage';
      step = 'auth';
    } else if (bookId === 3) {
      authTarget = 'test';
      step = 'auth';
    }
  }

  async function handleAuth() {
    try {
      const res = await fetch('/api/get-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tempId, pw: tempPw })
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "인증 실패");
        return;
      }

      const data = await res.json();
      personalWords = data.words || [];

      if (authTarget === 'manage') {
        step = 'p_edit';
      } else {
        if (personalWords.length === 0) return alert("데이터베이스에 단어가 없습니다.");
        startPersonalTest();
      }
    } catch (e) {
      alert("서버 연결에 실패했습니다.");
    }
  }

  function startPersonalTest() {
    let pool = [...personalWords].sort(() => Math.random() - 0.5);
    const targetCount = Math.ceil(pool.length / 5) * 5;
    
    while (pool.length < targetCount) {
      pool.push(personalWords[Math.floor(Math.random() * personalWords.length)]);
    }

    shuffledSets = [];
    for (let i = 0; i < pool.length; i += 5) {
      const chunk = pool.slice(i, i + 5).map(w => ({
        word: w.spelling,
        trans_word: w.meanings[0],
        mean: w.meanings.join(", "),
        same: w.meanings,
        example1: "", example2: ""
      }));
      shuffledSets.push(chunk as any);
    }

    const config = imageAssets[selectedType as keyof typeof imageAssets] || imageAssets['A'];
    const shuffledImgs = shuffle(config.individual);
    sessionImages = shuffledSets.map((_, i) => [shuffledImgs[i % shuffledImgs.length]]);

    currentSetIdx = 0;
    testMode = 'meaning_arr';
    step = 'test';
  }

  function startTest() {
    const allWords = shuffle(vocabularyList);
    shuffledSets = [
      allWords.slice(0, 20), allWords.slice(20, 40),
      allWords.slice(40, 60), allWords.slice(60, 80), allWords.slice(80, 100)
    ];

    const config = imageAssets[selectedType as keyof typeof imageAssets];
    const shuffledImgs = shuffle(config.individual);
    
    let imgPointer = 0;
    const tempImages: string[][] = [];
    for (let i = 0; i < 5; i++) {
      if (initialTypes[i]) {
        tempImages[i] = shuffledImgs.slice(imgPointer, imgPointer + 4);
        imgPointer += 4;
      } else {
        tempImages[i] = [shuffledImgs[imgPointer]];
        imgPointer += 1;
      }
    }
    sessionImages = tempImages;
    currentSetIdx = 0;
    testMode = 'syn_ex';
    step = 'test';
  }

  function goToMain() {
    step = 'main';
    selectedType = 'A';
    tempId = ""; tempPw = "";
  }

  function nextSet() {
    if (currentSetIdx < shuffledSets.length - 1) currentSetIdx++;
  }
</script>

<main class="ba-app">
  <div class="ba-main-bg">
    <div class="bg-base-image"></div>
    <div class="bg-trapezoid-overlay"></div>
    <div class="grid-overlay"></div>
  </div>

  <div class="lobby-container">
    <header class="ba-header">
      <div class="header-left">
        <div class="logo-symbol"></div>
        <div class="title-group">
          <h1>SCHALE TERMINAL</h1>
          <p>Voca Training System <span class="ver">v70.0.1</span></p>
        </div>
      </div>
      <div class="status-pill">SYSTEM ONLINE</div>
    </header>

    {#if step === 'main'}
      <div class="section-title">
        <span class="en">TASK SELECTION</span>
        <span class="kr">당번을 선택해 주세요, 선생님.</span>
      </div>

      <div class="card-group">
        {#each [['A', '슬렌더', 'SLENDER'], ['B', '농', 'NONG'], ['C', '빵', 'BBNG']] as [rank, kr, en]}
          <div class="ba-card" onclick={() => goBookSelect(rank as RewardType)}>
            <div class="card-tag">RANK {rank === 'C' ? 'S' : rank}</div>
            <div class="card-content">
              <span class="category">TYPE: {en}</span>
              <h3>{kr}</h3>
              <p>{kr} 작전은 세밀한 관찰과 집중력을 요합니까?</p>
            </div>
            <button class="deploy-btn">
              <span>DEPLOY</span>
              <span class="arrow">▶</span>
            </button>
          </div>
        {/each}
      </div>

    {:else if step === 'book'}
      <div class="section-title">
        <span class="en">DATABASE SELECTION</span>
        <span class="kr">단어장을 선택해 주십시오.</span>
      </div>
      
      <div class="card-group">
        <div class="ba-card" onclick={() => selectBook(1)}>
          <div class="card-tag">VOL. 01</div>
          <div class="card-content">
            <span class="category">DEFAULT</span>
            <h3>기존 단어장</h3>
            <p>기본 제공되는 100개의 단어로 훈련합니다.</p>
          </div>
          <button class="deploy-btn">
            <span>GO TO PLAN</span>
            <span class="arrow">▶</span>
          </button>
        </div>
        
        <div class="ba-card" onclick={() => selectBook(2)}>
          <div class="card-tag" style="background: var(--ba-blue);">VOL. 02</div>
          <div class="card-content">
            <span class="category" style="color: var(--ba-blue);">PRIVATE</span>
            <h3>단어 관리</h3>
            <p>개인 데이터를 수정하거나 추가합니다.</p>
          </div>
          <button class="deploy-btn blue-shadow">
            <span>EDIT DATABASE</span>
            <span class="arrow">▶</span>
          </button>
        </div>
        
        <div class="ba-card" onclick={() => selectBook(3)}>
          <div class="card-tag" style="background: var(--ba-blue);">VOL. 03</div>
          <div class="card-content">
            <span class="category" style="color: var(--ba-blue);">EXAM</span>
            <h3>개인 단어 시험</h3>
            <p>나만의 단어장으로 실전 테스트를 진행합니다.</p>
          </div>
          <button class="deploy-btn blue-shadow">
            <span>START MISSION</span>
            <span class="arrow">▶</span>
          </button>
        </div>
      </div>
      
      <div class="bottom-actions">
        <button class="side-btn big" onclick={goToMain}>BACK TO LOBBY</button>
      </div>

    {:else if step === 'auth'}
      <AuthModal bind:id={tempId} bind:pw={tempPw} onConfirm={handleAuth} onBack={() => step = 'book'} />

    {:else if step === 'p_edit'}
      <PersonalEditor id={tempId} pw={tempPw} bind:words={personalWords} onBack={() => step = 'book'} />

    {:else if step === 'plan'}
      <div class="plan-window" style="margin-top: 40px;">
        <div class="section-title">
          <span class="en">MISSION PLANNING</span>
          <span class="kr">작전 유형을 확정해 주십시오.</span>
        </div>
        <div class="plan-grid">
          {#each initialTypes as type, i}
            <div class="plan-card" class:is-syn={type}>
              <div class="set-label">SET 0{i+1}</div>
              <div class="type-btns">
                <button class:active={type} onclick={() => initialTypes[i] = true}>동의어</button>
                <button class:active={!type} onclick={() => initialTypes[i] = false}>예문</button>
              </div>
            </div>
          {/each}
        </div>
        <div class="plan-footer" style="display: flex; gap: 20px; justify-content: flex-end; margin-top: 30px;">
          <button class="side-btn big" style="height: 70px;" onclick={() => step = 'book'}>CANCEL</button>
          <button class="deploy-btn" style="width: 280px; margin: 0; height: 70px;" onclick={startTest}>
            <span>START MISSION</span>
            <span class="arrow">▶</span>
          </button>
        </div>
      </div>

    {:else if step === 'test'}
      <WordTest 
        setIdx={currentSetIdx} 
        words={shuffledSets[currentSetIdx]} 
        rewardType={selectedType} 
        setImages={sessionImages[currentSetIdx]} 
        {initialTypes} 
        onHome={goToMain} 
        onNext={nextSet} 
        {testMode} 
      />
    {/if}
  </div>
</main>

<style>
  /* 1. 기존의 모든 스타일 변함없이 유지 */
  :global(:root) { --ba-blue: #00A3FF; --ba-dark: #123456; --ba-bg-light: #F3F7F9; --ba-white: #FFFFFF; --ba-gray: #7F8C8D; --ba-border: #E2E8F0; }
  
  /* 2. 스크롤 제한만 해제 (overflow: hidden 제거 및 auto 추가) */
  :global(html, body) { 
    margin: 0; 
    padding: 0; 
    width: 100%; 
    height: 100%; 
    background-color: var(--ba-bg-light); 
    font-family: 'Pretendard', sans-serif; 
    overflow-y: auto !important; /* 잘림 방지를 위해 세로 스크롤 허용 */
  }

  .ba-app { 
    min-height: 100vh; 
    position: relative; 
    z-index: 1; 
    /* overflow: hidden 제거 */
  }

  .ba-main-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -2; }
  .bg-base-image { position: absolute; width: 100%; height: 100%; background: url('/tool/샬레전경.webp') no-repeat center; background-size: cover; }
  .bg-trapezoid-overlay { position: absolute; top: 0; right: 0; width: 75%; height: 100%; background: rgba(243, 247, 249, 0.88); clip-path: polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%); backdrop-filter: blur(5px); }
  .grid-overlay { position: absolute; width: 100%; height: 100%; background-image: radial-gradient(var(--ba-blue) 1px, transparent 1px); background-size: 40px 40px; opacity: 0.12; }
  
  .lobby-container { max-width: 1100px; margin: 0 auto; padding: 0 20px; min-height: 100vh; display: flex; flex-direction: column; position: relative; }
  
  .ba-header { width: 100%; padding: 40px 0 20px 0; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 4px solid var(--ba-dark); margin-bottom: 40px; flex-shrink: 0; }
  .header-left { display: flex; align-items: center; gap: 15px; }
  .logo-symbol { width: 45px; height: 45px; background: var(--ba-blue); clip-path: polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%); }
  .title-group h1 { margin: 0; font-size: 1.8rem; color: var(--ba-dark); font-weight: 900; line-height: 1.1; }
  .title-group p { margin: 0; font-size: 0.85rem; color: #345678; font-weight: 900; }
  .status-pill { background: var(--ba-dark); color: var(--ba-blue); padding: 6px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 900; margin-bottom: 5px; }
  
  .section-title { margin-bottom: 30px; flex-shrink: 0; }
  .section-title .en { display: block; font-size: 2.8rem; font-weight: 900; color: rgba(18, 52, 86, 0.07); line-height: 1; }
  .section-title .kr { display: block; font-size: 1.3rem; font-weight: 800; color: var(--ba-dark); margin-top: -16px; padding-left: 12px; border-left: 6px solid var(--ba-blue); }
  
  .card-group { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; width: 100%; flex-shrink: 0; }
  .ba-card { background: var(--ba-white); border: 3px solid var(--ba-border); border-radius: 0 45px 0 45px; position: relative; overflow: hidden; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; height: 330px; cursor: pointer; }
  .ba-card:hover { transform: translateY(-12px); border-color: var(--ba-blue); box-shadow: 18px 18px 0px rgba(0, 163, 255, 0.12); }
  
  .card-content { padding: 0 30px; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; }
  .card-content h3 { font-size: 2.1rem; font-weight: 900; color: var(--ba-dark); margin: 5px 0; }
  .category { font-size: 0.85rem; font-weight: 900; color: var(--ba-blue); text-transform: uppercase; }
  .card-content p { color: var(--ba-gray); font-size: 0.95rem; line-height: 1.5; margin: 0; word-break: keep-all; }

  .deploy-btn { margin: 20px 25px 25px 25px; height: 70px; background: var(--ba-dark); color: white; box-shadow: 6px 6px 0px #94a3b8; display: flex; justify-content: space-between; align-items: center; padding: 0 28px; font-size: 1.3rem; border: none; font-weight: 900; cursor: pointer; border-radius: 4px 24px 4px 24px; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  .blue-shadow { box-shadow: 6px 6px 0px var(--ba-blue); }
  .deploy-btn:hover { transform: translate(-4px, -4px); filter: contrast(1.1) brightness(1.1); box-shadow: 10px 10px 0px rgba(0,0,0,0.2); }
  .deploy-btn:active { transform: translate(2px, 2px); box-shadow: 0px 0px 0px transparent; }
  .deploy-btn .arrow { color: var(--ba-blue); font-size: 1.6rem; }

  .bottom-actions { margin-top: 40px; padding-bottom: 60px; display: flex; justify-content: center; width: 100%; }
  .side-btn.big { height: 80px; font-size: 1.4rem; padding: 0 40px; background: #475569; color: white; border: none; font-weight: 900; cursor: pointer; border-radius: 4px 24px 4px 24px; box-shadow: 6px 6px 0px #94a3b8; transition: all 0.2s; }
  .side-btn.big:hover { transform: translate(-4px, -4px); filter: brightness(1.1); }

  .card-tag { position: absolute; top: 0; left: 0; background: var(--ba-dark); color: white; padding: 7px 22px; font-size: 0.85rem; font-weight: 900; border-radius: 0 0 18px 0; z-index: 2; }

  .plan-window { background: rgba(255, 255, 255, 0.96); padding: 50px; border-radius: 0 50px 0 50px; border: 4px solid var(--ba-dark); box-shadow: 20px 20px 0px rgba(0, 163, 255, 0.1); }
  .plan-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin: 30px 0; }
  .plan-card { background: #F8FAFC; border: 3px solid #E2E8F0; border-radius: 15px; padding: 15px; text-align: center; }
  .type-btns { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
  .type-btns button { border: 1px solid #cbd5e1; background: white; padding: 8px; border-radius: 8px; font-weight: 800; cursor: pointer; }
  .type-btns button.active { background: var(--ba-dark); color: white; }
</style>