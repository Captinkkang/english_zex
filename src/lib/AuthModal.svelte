<script lang="ts">
  let { id = $bindable(), pw = $bindable(), onConfirm, onBack } = $props();
</script>

<div class="auth-overlay">
  <div class="auth-modal">
    <div class="auth-header">
      <div class="auth-icon"></div>
      <div class="auth-title">
        <h2>SCHALE AUTHENTICATION</h2>
        <p>데이터베이스 접근을 위해 권한을 확인합니다.</p>
      </div>
    </div>

    <div class="auth-body">
      <div class="input-field">
        <label for="uid">USER ID</label>
        <input id="uid" type="text" bind:value={id} placeholder="아이디 입력" />
      </div>
      <div class="input-field">
        <label for="upw">ACCESS KEY</label>
        <input id="upw" type="password" bind:value={pw} placeholder="비밀번호 입력" />
      </div>
    </div>

    <div class="auth-footer">
      <button class="back-btn" onclick={onBack}>CANCEL</button>
      <button class="confirm-btn" onclick={onConfirm}>ACCESS ▶</button>
    </div>
  </div>
</div>

<style>
  .auth-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(18, 52, 86, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .auth-modal { background: white; width: 400px; border-radius: 0 40px 0 40px; border: 4px solid #123456; padding: 30px; box-shadow: 20px 20px 0px rgba(0, 163, 255, 0.2); }
  .auth-header { display: flex; gap: 15px; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
  .auth-icon { width: 40px; height: 40px; background: #00A3FF; clip-path: polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%); }
  .auth-title h2 { margin: 0; font-size: 1.2rem; color: #123456; }
  .auth-title p { margin: 0; font-size: 0.75rem; color: #00A3FF; font-weight: bold; }
  .auth-body { display: flex; flex-direction: column; gap: 15px; }
  .input-field label { display: block; font-size: 0.8rem; font-weight: 900; color: #123456; margin-bottom: 5px; }
  .input-field input { width: 100%; padding: 12px; border: 2px solid #E2E8F0; border-radius: 8px; font-family: monospace; box-sizing: border-box; }
  .auth-footer { display: flex; gap: 10px; margin-top: 25px; }
  .auth-footer button { flex: 1; padding: 15px; border: none; border-radius: 10px; font-weight: 900; cursor: pointer; }
  .back-btn { background: #eee; color: #666; }
  .confirm-btn { background: #123456; color: white; border-bottom: 4px solid #00A3FF; }
</style>