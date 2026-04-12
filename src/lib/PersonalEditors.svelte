<script lang="ts">
  import type { PersonalWord } from './types';
  let { id, pw, words = $bindable(), onBack } = $props();

  let newSpelling = $state("");
  let newMean = $state("");

  async function saveToDB() {
    await fetch('/api/save-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pw, words })
    });
  }

  function addWord() {
    if (!newSpelling || !newMean) return;
    const newEntry: PersonalWord = {
      id: Math.random().toString(36).substr(2, 9),
      spelling: newSpelling,
      meanings: newMean.split(',').map(s => s.trim())
    };
    words = [...words, newEntry];
    newSpelling = ""; newMean = "";
    saveToDB();
  }

  function deleteWord(targetId: string) {
    words = words.filter((w: PersonalWord) => w.id !== targetId); // (w: PersonalWord)로 명시
    saveToDB();
  }
</script>

<div class="editor-container">
  <div class="editor-header">
    <span class="user-tag">ID: {id}</span>
    <h2>개인 데이터베이스 편집</h2>
    <button class="exit-btn" onclick={onBack}>CLOSE</button>
  </div>

  <div class="add-box">
    <input bind:value={newSpelling} placeholder="단어(Spelling)" />
    <input bind:value={newMean} placeholder="의미 (쉼표로 구분: 사과, 이익, 애플)" />
    <button onclick={addWord}>ADD</button>
  </div>

  <div class="word-table">
    <div class="table-head">
      <span>SPELLING</span>
      <span>MEANINGS</span>
      <span>ACTION</span>
    </div>
    <div class="table-body">
      {#each words as w}
        <div class="table-row">
          <span class="spelling">{w.spelling}</span>
          <span class="meanings">{w.meanings.join(', ')}</span>
          <button onclick={() => deleteWord(w.id)}>DEL</button>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .editor-container { background: white; border-radius: 20px; padding: 30px; border: 3px solid #123456; max-width: 800px; margin: 50px auto; }
  .editor-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #00A3FF; margin-bottom: 20px; }
  .user-tag { background: #123456; color: white; padding: 4px 10px; font-size: 0.8rem; font-weight: 900; }
  .add-box { display: grid; grid-template-columns: 1fr 2fr auto; gap: 10px; margin-bottom: 25px; }
  .add-box input { padding: 12px; border: 2px solid #eee; border-radius: 8px; }
  .add-box button { background: #00A3FF; color: white; border: none; padding: 0 20px; border-radius: 8px; font-weight: 900; cursor: pointer; }
  .word-table { border: 2px solid #eee; border-radius: 10px; overflow: hidden; }
  .table-head { background: #f8fafc; display: grid; grid-template-columns: 1fr 2fr 80px; padding: 10px; font-weight: 900; border-bottom: 2px solid #eee; }
  .table-row { display: grid; grid-template-columns: 1fr 2fr 80px; padding: 10px; border-bottom: 1px solid #eee; align-items: center; }
  .spelling { font-weight: 900; color: #123456; }
  .meanings { color: #666; }
  .table-row button { background: #ff4d4d; color: white; border: none; border-radius: 4px; padding: 5px; cursor: pointer; }
  .exit-btn { background: #123456; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; }
</style>