/* ==========================================================================
   Gender Reveal Logic - Interactive & Sound Effects (Web Audio API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let soundEnabled = true;
  let isRevealed = false;
  let popCount = 0;
  let userVote = null;

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
      } else if (type === 'pop') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
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
    playSound('click');
    userVote = 'girl';
    voteGirlBtn.classList.add('selected');
    voteBoyBtn.classList.remove('selected');
    voteMessage.classList.remove('hidden');
    voteMessage.innerHTML = `💖 <b>"예쁜 공주님일 것 같아요!"</b>라고 예측하셨네요!<br>아래에서 진짜 성별 상자를 열어보세요! 👇`;
  });

  voteBoyBtn.addEventListener('click', () => {
    playSound('click');
    userVote = 'boy';
    voteBoyBtn.classList.add('selected');
    voteGirlBtn.classList.remove('selected');
    voteMessage.classList.remove('hidden');
    voteMessage.innerHTML = `⚽ <b>"늠름한 왕자님일 것 같아요!"</b>라고 예측하셨네요!<br>아래에서 진짜 성별 상자를 열어보세요! 👇`;
  });

  // 2. TAB SWITCHING
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const targetTab = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'scratch-tab') {
        initScratchCanvas();
      }
    });
  });

  // 3. REVEAL EXPERIENCES

  // (A) Gift Box Reveal
  const giftBox = document.getElementById('giftBox');
  giftBox.addEventListener('click', () => {
    if (isRevealed) return;
    giftBox.classList.add('opened');
    triggerGrandReveal('giftBox');
  });

  // (B) Balloon Pop Reveal
  const balloonTarget = document.getElementById('balloonTarget');
  const mainBalloon = document.getElementById('mainBalloon');
  const dot1 = document.getElementById('dot1');
  const dot2 = document.getElementById('dot2');
  const dot3 = document.getElementById('dot3');

  balloonTarget.addEventListener('click', () => {
    if (isRevealed) return;
    popCount++;
    playSound('pop');

    // Wiggle balloon effect
    mainBalloon.style.transform = `scale(${1 + popCount * 0.08})`;

    if (popCount === 1) dot1.classList.add('active');
    if (popCount === 2) dot2.classList.add('active');

    if (popCount >= 3) {
      dot3.classList.add('active');
      mainBalloon.style.display = 'none';
      triggerGrandReveal('balloon');
    }
  });

  // (C) Scratch Card Canvas
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
    let scratchedPixels = 0;

    function getBrushPos(xRef, yRef) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: xRef - rect.left,
        y: yRef - rect.top
      };
    }

    function scratch(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2, false);
      ctx.fill();
      checkScratchProgress();
    }

    function checkScratchProgress() {
      if (isRevealed) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let clearPixels = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) clearPixels++;
      }
      const percentage = (clearPixels / (pixels.length / 4)) * 100;
      if (percentage > 45) {
        canvas.style.display = 'none';
        triggerGrandReveal('scratch');
      }
    }

    // Touch & Mouse Listeners
    canvas.addEventListener('mousedown', (e) => { isDrawing = true; const pos = getBrushPos(e.clientX, e.clientY); scratch(pos.x, pos.y); });
    canvas.addEventListener('mousemove', (e) => { if (isDrawing) { const pos = getBrushPos(e.clientX, e.clientY); scratch(pos.x, pos.y); } });
    canvas.addEventListener('mouseup', () => { isDrawing = false; });

    canvas.addEventListener('touchstart', (e) => { isDrawing = true; const touch = e.touches[0]; const pos = getBrushPos(touch.clientX, touch.clientY); scratch(pos.x, pos.y); });
    canvas.addEventListener('touchmove', (e) => { if (isDrawing) { const touch = e.touches[0]; const pos = getBrushPos(touch.clientX, touch.clientY); scratch(pos.x, pos.y); } });
    canvas.addEventListener('touchend', () => { isDrawing = false; });
  }

  // GRAND REVEAL TRIGGER FUNCTION
  function triggerGrandReveal(source) {
    if (isRevealed) return;
    isRevealed = true;

    playSound('fanfare');

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

  // 4. GUESTBOOK / BLESSINGS FUNCTIONALITY
  const blessingForm = document.getElementById('blessingForm');
  const blessingList = document.getElementById('blessingList');
  const authorInput = document.getElementById('authorInput');
  const messageInput = document.getElementById('messageInput');

  // Initial Sample Messages
  const defaultBlessings = [
    {
      author: '할아버지 👴',
      message: '사랑하는 우리 첫 손주! 늠름하고 멋진 사나이로 태어나길 기도하마. 씩씩하게 만나자!',
      time: '방금 전'
    },
    {
      author: '외할머니 👵',
      message: '복덩이 우리 손주! 엄마 배 속에서 건강히 잘 지내고 얼른 우리품에 와다오. 축복한다!',
      time: '방금 전'
    }
  ];

  function loadBlessings() {
    const stored = localStorage.getItem('gender_reveal_blessings');
    const blessings = stored ? JSON.parse(stored) : defaultBlessings;
    renderBlessings(blessings);
  }

  function renderBlessings(list) {
    blessingList.innerHTML = '';
    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'blessing-item';
      card.innerHTML = `
        <div class="blessing-author">${escapeHtml(item.author)}</div>
        <div class="blessing-content">${escapeHtml(item.message)}</div>
        <div class="blessing-time">${item.time}</div>
      `;
      blessingList.appendChild(card);
    });
  }

  blessingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const author = authorInput.value.trim();
    const message = messageInput.value.trim();

    if (!author || !message) return;

    playSound('click');

    const stored = localStorage.getItem('gender_reveal_blessings');
    const blessings = stored ? JSON.parse(stored) : defaultBlessings;

    const newBlessing = {
      author: author,
      message: message,
      time: '방금 전'
    };

    blessings.unshift(newBlessing);
    localStorage.setItem('gender_reveal_blessings', JSON.stringify(blessings));

    renderBlessings(blessings);

    authorInput.value = '';
    messageInput.value = '';
  });

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  // Initialize guestbook
  loadBlessings();
});
