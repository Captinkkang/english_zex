<script lang="ts">
  import WordTest from '../lib/WordTest.svelte';
  import type { WordItem, RewardType } from '../lib/types';
  import { imageAssets } from '../lib/imageAssets'; // 이미지 파일명 리스트
  import rawData from '../lib/data.json';

  // 1. 상태 관리 (Svelte 5 Runes)
  let step = $state<'main' | 'test'>('main');
  let selectedType = $state<RewardType>('');
  let shuffledSets = $state<WordItem[][]>([]);
  let sessionImages = $state<string[][]>([]); // 각 세트에서 사용할 이미지 묶음
  let currentSetIdx = $state(0);

  const vocabularyList = rawData as WordItem[];

  // 2. 유틸리티 함수
  function shuffle<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
  }

  // 3. 테스트 시작 로직
  function startTest(type: RewardType) {
    selectedType = type;
    
    // 단어 섞기 및 20개씩 5세트 분할
    const allWords = shuffle(vocabularyList);
    shuffledSets = [
      allWords.slice(0, 20),
      allWords.slice(20, 40),
      allWords.slice(40, 60),
      allWords.slice(60, 80),
      allWords.slice(80, 100)
    ];

    // 이미지 랜덤 배정 로직
    const config = imageAssets[type as keyof typeof imageAssets];
    const shuffledImgs = shuffle(config.individual); // 전체 이미지 풀 셔플
    
    let imgPointer = 0;
    const tempImages: string[][] = [];

    for (let i = 0; i < 5; i++) {
      if (i % 2 === 0) {
        // 1, 3, 5세트 (idx 0, 2, 4): 5문제당 1장씩 총 4장 필요
        tempImages[i] = shuffledImgs.slice(imgPointer, imgPointer + 4);
        imgPointer += 4;
      } else {
        // 2, 4세트 (idx 1, 3): 20문제당 사진 1장 필요
        tempImages[i] = [shuffledImgs[imgPointer]];
        imgPointer += 1;
      }
    }

    sessionImages = tempImages;
    currentSetIdx = 0;
    step = 'test';
  }

  // 4. 네비게이션 함수
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

<main>
  {#if step === 'main'}
    <div class="main-container">
      <header>
        <h1>Voca Test Challenge</h1>
        <p>테스트를 완료하고 사진을 잠금 해제하세요!</p>
      </header>

      <div class="card-group">
        <div class="card">
          <h3>유형 A</h3>
          <p>자연과 풍경</p>
          <button onclick={() => startTest('A')}>시작하기</button>
        </div>
        <div class="card">
          <h3>유형 B</h3>
          <p>도시와 건축</p>
          <button onclick={() => startTest('B')}>시작하기</button>
        </div>
        <div class="card">
          <h3>유형 C</h3>
          <p>귀여운 동물들</p>
          <button onclick={() => startTest('C')}>시작하기</button>
        </div>
      </div>
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
  :global(body) {
    margin: 0;
    font-family: 'Pretendard', -apple-system, sans-serif;
    background-color: #f5f7fa;
    color: #333;
  }

  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .main-container {
    text-align: center;
    background: white;
    padding: 3rem;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  }

  header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: #2d3436;
  }

  header p {
    color: #636e72;
    margin-bottom: 3rem;
  }

  .card-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .card {
    padding: 2rem;
    border: 1px solid #e1e8ed;
    border-radius: 15px;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }

  .card h3 {
    margin-top: 0;
  }

  button {
    background-color: #0984e3;
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover {
    background-color: #74b9ff;
  }
</style>