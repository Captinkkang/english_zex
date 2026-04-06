<script lang="ts">
  /* ... 기존 로직 유지 ... */
  import WordTest from '../lib/WordTest.svelte';
  import type { WordItem, RewardType } from '../lib/types';
  import { imageAssets } from '../lib/imageAssets'; 
  import rawData from '../lib/data.json';

  let step = $state<'main' | 'test'>('main');
  let selectedType = $state<RewardType>('');
  let shuffledSets = $state<WordItem[][]>([]);
  let sessionImages = $state<string[][]>([]); 
  let currentSetIdx = $state(0);

  const vocabularyList = rawData as WordItem[];

  function shuffle<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
  }

  function startTest(type: RewardType) {
    selectedType = type;
    const allWords = shuffle(vocabularyList);
    shuffledSets = [
      allWords.slice(0, 20),
      allWords.slice(20, 40),
      allWords.slice(40, 60),
      allWords.slice(60, 80),
      allWords.slice(80, 100)
    ];

    const config = imageAssets[type as keyof typeof imageAssets];
    const shuffledImgs = shuffle(config.individual); 
    
    let imgPointer = 0;
    const tempImages: string[][] = [];
    for (let i = 0; i < 5; i++) {
      if (i % 2 === 0) {
        tempImages[i] = shuffledImgs.slice(imgPointer, imgPointer + 4);
        imgPointer += 4;
      } else {
        tempImages[i] = [shuffledImgs[imgPointer]];
        imgPointer += 1;
      }
    }
    sessionImages = tempImages;
    currentSetIdx = 0;
    step = 'test';
  }

  function goToMain() {
    step = 'main';
    selectedType = '';
  }

  function nextSet() {
    if (currentSetIdx < 4) {
      currentSetIdx++;
    }
  }
</script>

<main class="ba-app">
  <div class="ba-main-bg">
    <div class="bg-base-image"></div>
    <div class="bg-trapezoid-overlay"></div>
    <div class="grid-overlay"></div>
  </div>

  {#if step === 'main'}
    <div class="lobby-container">
      <header class="ba-header">
        <div class="header-left">
          <div class="logo-symbol"></div>
          <div class="title-group">
            <h1>SCHALE TERMINAL</h1>
            <p>Voca Training System <span class="ver">v69.74.0</span></p>
          </div>
        </div>
        <div class="header-right">
          <div class="status-badge">SYSTEM ONLINE</div>
        </div>
      </header>

      <section class="mission-select">
        <div class="section-title">
          <span class="en">TASK SELECTION</span>
          <span class="kr">당번을 선택해 주세요, 선생님.</span>
        </div>

        <div class="card-group">
          <div class="ba-card">
            <div class="card-tag">1538</div>
            <div class="card-content">
              <span class="category">Slender</span>
              <h3>슬렌더</h3>
              <p>다양한 매려이 있는 학생들과의 기록</p>
            </div>
            <button class="ba-start-btn" onclick={() => startTest('A')}>
              DEPLOY <span class="arrow">▶</span>
            </button>
            <div class="card-deco"></div>
          </div>

          <div class="ba-card">
            <div class="card-tag special">1124</div>
            <div class="card-content">
              <span class="category">NONG</span>
              <h3>농</h3>
              <p>연약하고 가녀린 학생들과의 기록</p>
            </div>
            <button class="ba-start-btn" onclick={() => startTest('B')}>
              DEPLOY <span class="arrow">▶</span>
            </button>
            <div class="card-deco"></div>
          </div>

          <div class="ba-card">
            <div class="card-tag">2245</div>
            <div class="card-content">
              <span class="category">BBang</span>
              <h3>전체</h3>
              <p>거대한 마음을 가진 학생들과의 기록</p>
            </div>
            <button class="ba-start-btn" onclick={() => startTest('C')}>
              DEPLOY <span class="arrow">▶</span>
            </button>
            <div class="card-deco"></div>
          </div>
        </div>
      </section>

      <footer class="ba-footer">
        <div class="footer-inner">
          <span class="blinking-dot"></span>
          CONNECTED TO S.C.H.A.L.E. CENTRAL SERVER
        </div>
      </footer>
    </div>
  {:else}
    <WordTest 
      setIdx={currentSetIdx} 
      words={shuffledSets[currentSetIdx]} 
      rewardType={selectedType}
      setImages={sessionImages[currentSetIdx]}
      onHome={goToMain}
      onNext={nextSet}
    />
  {/if}
</main>

<style>
  :global(:root) {
    --ba-blue: #00A3FF;
    --ba-dark: #123456;
    --ba-bg-light: #F3F7F9;
    --ba-white: #FFFFFF;
    --ba-gray: #7F8C8D;
  }

  :global(html, body) {
    margin: 0; padding: 0; width: 100%; height: 100%;
    overflow-x: hidden;
    background-color: var(--ba-bg-light);
  }

  .ba-app { min-height: 100vh; position: relative; z-index: 1; }

  /* 배경 레이어 */
  .ba-main-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -2; }
  .bg-base-image {
    position: absolute; width: 100%; height: 100%;
    background: url('/tool/샬레전경.webp') no-repeat center;
    background-size: cover;
  }
  .bg-trapezoid-overlay {
    position: absolute; top: 0; right: 0; width: 75%; height: 100%;
    background: rgba(243, 247, 249, 0.85);
    clip-path: polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%);
    backdrop-filter: blur(3px);
  }

  .grid-overlay {
    position: absolute; width: 100%; height: 100%;
    background-image: radial-gradient(var(--ba-blue) 1px, transparent 1px);
    background-size: 40px 40px; opacity: 0.1;
  }

  /* .scanline 스타일 제거됨 */

  .lobby-container { 
    max-width: 1100px; 
    margin: 0 auto; 
    padding: 0 20px; 
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .ba-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    border-bottom: 3px solid var(--ba-dark); 
    padding: 20px 15px; 
    margin-bottom: 50px;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    border-radius: 0 0 15px 15px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }
  .header-left { display: flex; align-items: center; gap: 20px; }
  .logo-symbol { width: 45px; height: 45px; background: var(--ba-blue); clip-path: polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%); }
  
  .title-group h1 { 
    margin: 0; font-size: 1.6rem; color: var(--ba-dark); 
    letter-spacing: 1px; font-weight: 900; 
    text-shadow: 1px 1px 0px white;
  }
  .title-group p { margin: 0; font-size: 0.8rem; color: var(--ba-blue); font-weight: bold; }
  .ver { color: var(--ba-dark); opacity: 0.6; }
  .status-badge { background: var(--ba-dark); color: white; padding: 4px 12px; font-weight: 900; font-size: 0.75rem; border-radius: 4px; }

  .mission-select { flex: 1; padding: 20px 0; }

  .section-title { margin-bottom: 40px; }
  .section-title .en { display: block; font-size: 2.8rem; font-weight: 900; color: rgba(18, 52, 86, 0.1); line-height: 1; }
  .section-title .kr { 
    display: block; font-size: 1.3rem; font-weight: 800; color: var(--ba-dark); 
    margin-top: -15px; padding-left: 4px; border-left: 4px solid var(--ba-blue); margin-left: 4px;
    text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
  }

  .card-group { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
  .ba-card {
    background: var(--ba-white); border: 2px solid #E2E8F0; border-radius: 0 30px 0 30px;
    padding: 35px 30px; position: relative; overflow: hidden; transition: all 0.3s;
    box-shadow: 10px 10px 0px rgba(18, 52, 86, 0.05); display: flex; flex-direction: column; justify-content: space-between; min-height: 220px;
  }
  .ba-card:hover { transform: translate(-4px, -4px); box-shadow: 15px 15px 0px rgba(0, 163, 255, 0.15); border-color: var(--ba-blue); }
  .card-tag { position: absolute; top: 0; left: 0; background: var(--ba-dark); color: white; padding: 5px 15px; font-size: 0.75rem; font-weight: 900; border-radius: 0 0 10px 0; }
  .card-tag.special { background: #FF5E5E; }
  .category { color: var(--ba-blue); font-weight: 900; font-size: 0.85rem; letter-spacing: 1px; }
  .ba-card h3 { margin: 10px 0; font-size: 2.2rem; font-weight: 900; color: var(--ba-dark); }
  .ba-card p { margin: 0; font-size: 0.95rem; color: var(--ba-gray); line-height: 1.5; margin-bottom: 30px; }

  /* 버튼 호버 효과 이식 버전 */
  .ba-start-btn {
    background: var(--ba-dark); color: white; border: none; padding: 15px; border-radius: 12px;
    font-weight: 900; cursor: pointer; font-size: 1rem;
    display: flex; justify-content: space-between; align-items: center;
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 4px 4px 0px var(--ba-blue);
  }
  .ba-start-btn:hover { 
    background: var(--ba-blue); 
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px var(--ba-dark);
  }
  .arrow { font-size: 0.8rem; opacity: 0.7; transition: transform 0.2s; }
  .ba-start-btn:hover .arrow { transform: translateX(3px); }

  .card-deco { position: absolute; bottom: 0; right: 0; width: 60px; height: 8px; background: var(--ba-blue); clip-path: polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%); }

  .ba-footer { 
    margin-top: auto; 
    padding: 25px 20px; 
    background: var(--ba-dark); 
    color: rgba(255,255,255,0.4); 
    border-radius: 15px 15px 0 0; 
    font-size: 0.8rem; 
    font-weight: bold; 
    text-align: center; 
  }
  .footer-inner { display: flex; align-items: center; justify-content: center; gap: 10px; }
  .blinking-dot { width: 6px; height: 6px; background: #00FF00; border-radius: 50%; animation: blink 1.5s infinite; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
</style>