/* ==========================================================================
   Gender Reveal Logic - Interactive & Sound Effects (Web Audio API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let soundEnabled = true;
  let isRevealed = false;
  let userVote = null;

  // Preload audio objects globally
  const loseAudio = new Audio('./assets/audio/lose.mp3');
  const winAudio = new Audio('./assets/audio/win.mp3');
  loseAudio.preload = 'auto';
  winAudio.preload = 'auto';
  // Keep muted initially to safely unlock on mobile without leaking sound
  loseAudio.muted = true;
  winAudio.muted = true;

  // Web Audio Context for Sound Effects
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
  }

  // Play Sound Effects Synthesizer
  function playSound(type) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;

      if (type === 'click') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'fanfare') {
        // Celebratory chord (C Major / F Major progression)
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.2);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 1.2);
        });
      } else if (type === 'lose') {
        loseAudio.muted = false;
        loseAudio.currentTime = 0;
        loseAudio.play().catch(e => console.warn('Audio play failed:', e));
      } else if (type === 'win') {
        winAudio.muted = false;
        winAudio.currentTime = 0;
        winAudio.play().catch(e => console.warn('Audio play failed:', e));
      }
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  }

  // Sound Toggle Button
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundLabel = document.getElementById('soundLabel');

  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🎵' : '🔇';
    soundLabel.textContent = soundEnabled ? '음향 효과 ON' : '음향 효과 OFF';
    if (soundEnabled) playSound('click');
  });

  // 1. VOTE SECTION INTERACTION
  const voteGirlBtn = document.getElementById('voteGirlBtn');
  const voteBoyBtn = document.getElementById('voteBoyBtn');
  const voteMessage = document.getElementById('voteMessage');

  voteGirlBtn.addEventListener('click', () => {
    if (isRevealed) return;
    playSound('click');
    userVote = 'girl';
    
    // Unlock and preload on mobile interaction (plays muted)
    loseAudio.play().then(() => { loseAudio.pause(); }).catch(() => {});

    voteGirlBtn.classList.add('selected');
    voteBoyBtn.classList.remove('selected');
    voteMessage.classList.remove('hidden');
    voteMessage.innerHTML = `💖 <b>"예쁜 공주님일 것 같아요!"</b>라고 예측하셨네요!<br>아래에서 복권을 긁어 진짜 성별을 확인해보세요! 👇`;
  });

  voteBoyBtn.addEventListener('click', () => {
    if (isRevealed) return;
    playSound('click');
    userVote = 'boy';

    // Unlock and preload on mobile interaction (plays muted)
    winAudio.play().then(() => { winAudio.pause(); }).catch(() => {});

    voteBoyBtn.classList.add('selected');
    voteGirlBtn.classList.remove('selected');
    voteMessage.classList.remove('hidden');
    voteMessage.innerHTML = `⚽ <b>"늠름한 왕자님일 것 같아요!"</b>라고 예측하셨네요!<br>아래에서 복권을 긁어 진짜 성별을 확인해보세요! 👇`;
  });

  // 2. SCRATCH CARD CANVAS (Grid-Based Scratch System for 100% local and mobile webview reliability)
  let canvasInitialized = false;
  function initScratchCanvas() {
    if (canvasInitialized) return;
    canvasInitialized = true;

    const canvas = document.getElementById('scratchCanvas');
    const ctx = canvas.getContext('2d');

    // Draw silver foil
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Overlay text on foil
    ctx.fillStyle = '#666';
    ctx.font = 'bold 16px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('여기를 동전으로 긁어보세요! 🪙', canvas.width / 2, canvas.height / 2 + 5);

    let isDrawing = false;

    // Grid scratch tracking variables (prevents cross-origin security errors with local file://)
    const gridCols = 10;
    const gridRows = 6;
    const cellWidth = canvas.width / gridCols;
    const cellHeight = canvas.height / gridRows;
    const scratchGrid = Array(gridRows).fill().map(() => Array(gridCols).fill(false));
    let scratchedCellsCount = 0;
    const totalCells = gridCols * gridRows;

    function getBrushPos(xRef, yRef) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (xRef - rect.left) * scaleX,
        y: (yRef - rect.top) * scaleY
      };
    }

    function scratch(x, y) {
      if (!userVote) {
        alert('먼저 Step 1에서 도담이의 성별을 예측해주세요! 👶');
        isDrawing = false;
        return;
      }
      
      // 1. Draw scratch effect on canvas
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2, false);
      ctx.fill();

      // 2. Update grid scratched cells
      const brushRadius = 12;
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          if (scratchGrid[r][c]) continue;
          
          // Calculate center of grid cell
          const cellX = c * cellWidth + cellWidth / 2;
          const cellY = r * cellHeight + cellHeight / 2;
          
          // Check if within scratch area
          const dx = x - cellX;
          const dy = y - cellY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < brushRadius + 8) {
            scratchGrid[r][c] = true;
            scratchedCellsCount++;
          }
        }
      }

      checkScratchProgress();
    }

    function checkScratchProgress() {
      if (isRevealed) return;
      const percentage = (scratchedCellsCount / totalCells) * 100;
      if (percentage > 45) {
        canvas.style.display = 'none';
        triggerGrandReveal();
      }
    }

    // Touch & Mouse Listeners
    canvas.addEventListener('mousedown', (e) => { 
      isDrawing = true; 
      const pos = getBrushPos(e.clientX, e.clientY); 
      scratch(pos.x, pos.y); 
    });

    canvas.addEventListener('mousemove', (e) => { 
      if (isDrawing) { 
        const pos = getBrushPos(e.clientX, e.clientY); 
        scratch(pos.x, pos.y); 
      } 
    });

    canvas.addEventListener('mouseup', () => { isDrawing = false; });
    canvas.addEventListener('mouseleave', () => { isDrawing = false; });

    canvas.addEventListener('touchstart', (e) => { 
      isDrawing = true; 
      const touch = e.touches[0]; 
      const pos = getBrushPos(touch.clientX, touch.clientY); 
      scratch(pos.x, pos.y); 
      e.preventDefault(); // Prevents page scrolling while scratching
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => { 
      if (isDrawing) { 
        const touch = e.touches[0]; 
        const pos = getBrushPos(touch.clientX, touch.clientY); 
        scratch(pos.x, pos.y); 
        e.preventDefault();
      } 
    }, { passive: false });

    canvas.addEventListener('touchend', () => { isDrawing = false; });
  }

  // GRAND REVEAL TRIGGER FUNCTION
  function triggerGrandReveal() {
    if (isRevealed) return;
    isRevealed = true;

    if (userVote === 'girl') {
      playSound('lose');
    } else {
      playSound('win');
    }

    // Launch Confetti Effect
    if (typeof confetti === 'function') {
      // First burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3A86FF', '#D4AF37', '#60A5FA', '#FFFFFF', '#93C5FD']
      });

      // Secondary side bursts
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3A86FF', '#D4AF37', '#FFFFFF']
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3A86FF', '#D4AF37', '#FFFFFF']
        });
      }, 300);
    }

    // Display Result Card
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');

    // Smooth scroll down to result card
    setTimeout(() => {
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  }

  // Re-celebrate Button
  const reCelebrateBtn = document.getElementById('reCelebrateBtn');
  reCelebrateBtn.addEventListener('click', () => {
    playSound('fanfare');
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#3A86FF', '#D4AF37', '#93C5FD', '#FFFFFF']
      });
    }
  });

  // Share / Copy Link Button
  const shareKakaoBtn = document.getElementById('shareKakaoBtn');
  shareKakaoBtn.addEventListener('click', () => {
    playSound('click');
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('✨ 링크가 복사되었습니다! 카카오톡이나 문자메시지로 부모님께 전달해보세요!');
      }).catch(() => {
        alert(`공유 링크: ${url}`);
      });
    } else {
      alert(`공유 링크: ${url}`);
    }
  });

  // Initialize Scratch Canvas directly on load
  initScratchCanvas();
});
