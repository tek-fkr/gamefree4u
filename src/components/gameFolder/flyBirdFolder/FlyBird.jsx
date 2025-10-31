import React, { useEffect, useRef, useState } from "react";
import "./FlyBird.css";

import bgImg from "../media/bg.jpg";
import birdImg from "../media/image.jpg";
import pipeImg from "../media/pipe.png";
import amitabh from "../media/amitabh.jpg";
import gameMusicFile from "../media/modi.mp3";
import gameOverFile from "../media/memeGirl.mp3";
import gameOverFile2 from "../media/amitabh.mp3";

export default function FlyBird() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Refs for mutable values used inside animation loop and event handlers
  const isGameStartedRef = useRef(false);
  const isGameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const animationIdRef = useRef(null);
  const gameMusicRef = useRef(null);
  const gameOverSoundRef1 = useRef(null);
  const gameOverSoundRef2 = useRef(null);
  const lastGameOverIndexRef = useRef(null);
  const gameOverMsgRef = useRef('');
  const startInvulnerableRef = useRef(false);
  const invulTimeoutRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const viewWidthRef = useRef(700);
  const viewHeightRef = useRef(500);
  const imagesLoadedRef = useRef(0);
  const imagesReadyRef = useRef(false);
  const lastInputTimeRef = useRef(0);
  // countdown refs for post-game '3..2..1' behavior
  const countdownValueRef = useRef(0);
  const isCountingRef = useRef(false);
  const canRestartRef = useRef(false);
  const countdownIntervalRef = useRef(null);
  // start button rect for the custom start screen (in CSS pixels)
  const startButtonRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  // amitabh image + display refs (shown when gameOverFile2 plays)
  const amitabhImgRef = useRef(null);
  const showAmitabhRef = useRef(false);
  const amitabhOpacityRef = useRef(1);
  const amitabhFadeStartRef = useRef(0);
  const amitabhFadeDurationRef = useRef(500);
  const amitabhStartTimeRef = useRef(0);
  const amitabhFadingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Responsive canvas sizing + HiDPI support
    const dpr = window.devicePixelRatio || 1;
    const aspect = 700 / 500;
    const resizeCanvas = () => {
      // choose css width to fit screen but not exceed design width
      const cssMaxWidth = Math.min(700, window.innerWidth - 20);
      const cssWidth = Math.max(300, cssMaxWidth);
      const cssHeight = Math.max(300, Math.round(cssWidth / aspect));
      canvas.style.width = cssWidth + 'px';
      canvas.style.height = cssHeight + 'px';
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      // make drawing coordinates map 1:1 to CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      viewWidthRef.current = cssWidth;
      viewHeightRef.current = cssHeight;
    };
    // initial sizing
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load images
    const bg = new Image();
    const bird = new Image();
    const pipe = new Image();

    // increment when each image loads; only draw/start after all are ready
    const onImageLoad = () => {
      imagesLoadedRef.current += 1;
      if (imagesLoadedRef.current >= 3) {
        imagesReadyRef.current = true;
        // if the game was already started (user pressed quickly), start the loop now
        if (isGameStartedRef.current) {
          // avoid creating multiple RAF loops
          if (!animationIdRef.current) draw();
        } else {
          // draw custom start screen when images ready
          try {
            // helper to draw start screen
            drawStartScreen();
          } catch (e) {}
        }
      }
    };

    bg.onload = onImageLoad;
    bird.onload = onImageLoad;
    pipe.onload = onImageLoad;

    // drawStartScreen helper (used before RAF loop starts)
    const drawStartScreen = () => {
      const vw = viewWidthRef.current;
      const vh = viewHeightRef.current;
      try {
        ctx.clearRect(0, 0, vw, vh);
        bgX = 0;
        ctx.drawImage(bg, bgX, 0, vw, vh);
        ctx.drawImage(bg, bgX + vw, 0, vw, vh);

        // Title: 'gameFree4Play' with golden gradient and subtle stroke
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 48px sans-serif';
        const grad = ctx.createLinearGradient(vw / 2 - 150, vh / 2 - 80, vw / 2 + 150, vh / 2 - 80);
        grad.addColorStop(0, '#fff1b8');
        grad.addColorStop(0.5, '#ffd700');
        grad.addColorStop(1, '#c78f00');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 12;
        ctx.fillText('gameFree4Play', vw / 2, vh / 2 - 40);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.strokeText('gameFree4Play', vw / 2, vh / 2 - 40);
        ctx.restore();

        // Start button
        const btnW = Math.min(260, Math.round(vw * 0.5));
        const btnH = 60;
        const btnX = Math.round(vw / 2 - btnW / 2);
        const btnY = Math.round(vh / 2 + 10);
        // save for click detection
        startButtonRef.current = { x: btnX, y: btnY, w: btnW, h: btnH };

        // golden button gradient
        const g = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
        g.addColorStop(0, '#ffd26a');
        g.addColorStop(0.5, '#ffb700');
        g.addColorStop(1, '#c78f00');

        // rounded rect background
        const r = 10;
        ctx.beginPath();
        ctx.moveTo(btnX + r, btnY);
        ctx.lineTo(btnX + btnW - r, btnY);
        ctx.quadraticCurveTo(btnX + btnW, btnY, btnX + btnW, btnY + r);
        ctx.lineTo(btnX + btnW, btnY + btnH - r);
        ctx.quadraticCurveTo(btnX + btnW, btnY + btnH, btnX + btnW - r, btnY + btnH);
        ctx.lineTo(btnX + r, btnY + btnH);
        ctx.quadraticCurveTo(btnX, btnY + btnH, btnX, btnY + btnH - r);
        ctx.lineTo(btnX, btnY + r);
        ctx.quadraticCurveTo(btnX, btnY, btnX + r, btnY);
        ctx.closePath();
        ctx.fillStyle = g;
        ctx.fill();
        // button inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(btnX + 6, btnY + 6, btnW - 12, Math.round(btnH / 2));

        // button text
        ctx.fillStyle = '#4a2b00';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('START', vw / 2, btnY + btnH / 2);
      } catch (e) {
        // drawing might fail if canvas/context not ready
      }
    };

    bg.src = bgImg;
    bird.src = birdImg;
    pipe.src = pipeImg;

    // Load sounds (store in refs so we have single instances)
    gameMusicRef.current = new Audio(gameMusicFile);
    gameMusicRef.current.loop = true;
    gameOverSoundRef1.current = new Audio(gameOverFile);
    gameOverSoundRef2.current = new Audio(gameOverFile2);

    // Load the amitabh image (used only when gameOverFile2 plays)
    const amitabhImg = new Image();
    amitabhImg.src = amitabh;
    amitabhImgRef.current = amitabhImg;

    // when the second game-over audio ends, start a smooth fade-out of the image
    const onAmitabhEnded = () => {
      // begin fading out the image smoothly
      amitabhFadingRef.current = true;
      amitabhFadeStartRef.current = performance.now();
      // keep fade duration configurable
      amitabhFadeDurationRef.current = 500; // ms
    };
    // attach listener (guard in case audio isn't ready yet)
    try {
      if (gameOverSoundRef2.current && gameOverSoundRef2.current.addEventListener) {
        gameOverSoundRef2.current.addEventListener('ended', onAmitabhEnded);
      }
    } catch (e) {}

    // Bird physics
    let birdX = 60;
    let birdY = 200;
    let birdVelocity = 0;
  // bird size (reduced)
  const birdWidth = 34; // decreased size
  const birdHeight = 24; // decreased size
  const gravity = 0.4;
  const lift = -6;

    // position bird relative to the current view size (center vertically, left-side horizontally)
    const positionBird = () => {
      try {
        const vw = viewWidthRef.current || 700;
        const vh = viewHeightRef.current || 500;
        // on narrow screens center the bird horizontally; otherwise place at 15% from left
        if (vw <= 480) birdX = Math.round(vw / 2 - birdWidth / 2);
        else birdX = Math.round(vw * 0.15);
        birdY = Math.round(vh / 2 - birdHeight / 2);
      } catch (e) {}
    };

    // Pipes
    let pipes = [];
  // pipe gap: make it more forgiving so the player can pass more easily.
  // Use a larger minimum and scale with bird size.
  const pipeGap = Math.max(120, Math.round(birdHeight * 3.5));
  const pipeWidth = 50;
  // horizontal spacing between pipes (reduced so pipes are closer together)
  const pipeDistance = 240;

  // starting (easier) speed for first rounds — keep it low so game feels slower
  const baseSpeed = 1.0;
  let gameSpeed = baseSpeed;
  let bgX = 0;

    // ✅ Create new pipe (random vertical position)
    const createPipe = () => {
      const vw = viewWidthRef.current;
      const vh = viewHeightRef.current;
      // center the gap roughly around the vertical center of the canvas with a small random offset
      const gapCenter = vh / 2 + (Math.random() * 100 - 50); // +/-50px
      // top pipe y so that the gap is centered at gapCenter
      const topY = Math.floor(gapCenter - pipeGap / 2 - 300); // 300 is pipe image height
  // if starting invulnerable, spawn the first pipe slightly further to the right
  // (small offset so it doesn't appear too far away)
  const extraSpawnOffset = startInvulnerableRef.current && pipes.length === 0 ? 80 : 0;
      pipes.push({ x: vw + extraSpawnOffset, y: topY });
    };

    // ✅ Start game
    const startGame = () => {
      if (isGameStartedRef.current) return;
      // update refs and React state
      // ensure amitabh image is hidden when starting a new game
      try {
        showAmitabhRef.current = false;
        amitabhOpacityRef.current = 0;
        amitabhFadingRef.current = false;
        amitabhStartTimeRef.current = 0;
      } catch (e) {}
      isGameStartedRef.current = true;
      isGameOverRef.current = false;
      setIsGameStarted(true);
      setIsGameOver(false);
      scoreRef.current = 0;
      setScore(0);

      // position bird based on current view size
      positionBird();
      birdVelocity = 0;
      pipes = [];
      bgX = 0;
  // start at base speed (slower)
  gameSpeed = baseSpeed;

      // restart background music
      try {
        gameMusicRef.current.currentTime = 0;
        gameMusicRef.current.play();
      } catch (err) {
        // autoplay may be blocked; ignore
      }

      // ensure any game-over sounds are stopped when restarting
      try {
        if (gameOverSoundRef1.current) { gameOverSoundRef1.current.pause(); gameOverSoundRef1.current.currentTime = 0; }
      } catch (e) {}
      try {
        if (gameOverSoundRef2.current) { gameOverSoundRef2.current.pause(); gameOverSoundRef2.current.currentTime = 0; }
      } catch (e) {}

      // give a short invulnerability window to avoid instant-out on the first pipe
      startInvulnerableRef.current = true;
      if (invulTimeoutRef.current) clearTimeout(invulTimeoutRef.current);
      // slightly longer grace to be more forgiving
      invulTimeoutRef.current = setTimeout(() => {
        startInvulnerableRef.current = false;
        invulTimeoutRef.current = null;
      }, 800);

      // start animation loop if not already running
      if (!animationIdRef.current) draw();
    };

    // ✅ End game
    const endGame = (message = 'GAME OVER') => {
      // guard to ensure game over logic runs once
      if (isGameOverRef.current) return;
      isGameOverRef.current = true;
      setIsGameOver(true);
      gameOverMsgRef.current = message;

      // pause background music
      try {
        gameMusicRef.current.pause();
      } catch (err) {}

      // choose one of the two game-over sounds to play (shuffle without immediate repeat)
      try {
        // stop both to ensure only one plays
        if (gameOverSoundRef1.current) {
          try { gameOverSoundRef1.current.pause(); gameOverSoundRef1.current.currentTime = 0; } catch (e) {}
        }
        if (gameOverSoundRef2.current) {
          try { gameOverSoundRef2.current.pause(); gameOverSoundRef2.current.currentTime = 0; } catch (e) {}
        }

        // pick index 0 or 1; avoid repeating the same index twice in a row
        let idx = Math.floor(Math.random() * 2);
        if (lastGameOverIndexRef.current !== null && idx === lastGameOverIndexRef.current) {
          idx = 1 - idx; // flip to avoid immediate repeat
        }
        lastGameOverIndexRef.current = idx;

        const toPlay = idx === 0 ? gameOverSoundRef1.current : gameOverSoundRef2.current;
        if (toPlay) {
          toPlay.currentTime = 0;
          // if the second game-over file will play, show the amitabh image for its duration
          if (idx === 1) {
            try {
              showAmitabhRef.current = true;
              amitabhOpacityRef.current = 1;
              amitabhFadingRef.current = false;
              amitabhStartTimeRef.current = performance.now();
            } catch (e) {}
          }
          // play() returns a promise in modern browsers; swallow rejections
          toPlay.play().catch(() => {});
        }
      } catch (err) {}

      // start 3..2..1 counting; while counting, user input won't restart the game
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      isCountingRef.current = true;
      canRestartRef.current = false;
      countdownValueRef.current = 3;
      // tick down each second. When it reaches 1 we stop counting and allow restart by click.
      countdownIntervalRef.current = setInterval(() => {
        try {
          countdownValueRef.current -= 1;
          if (countdownValueRef.current <= 1) {
            // stop counting at 1 and allow restart by user click
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            isCountingRef.current = false;
            canRestartRef.current = true;
          }
        } catch (e) {}
      }, 1000);
    };

  // ✅ Restart game (used when user opts to restart after countdown)
    const resetGame = () => {
      isGameStartedRef.current = false;
      isGameOverRef.current = false;
      setIsGameStarted(false);
      setIsGameOver(false);
      scoreRef.current = 0;
      setScore(0);
  // reposition bird for the reset
  positionBird();
      birdVelocity = 0;
      pipes = [];
      bgX = 0;
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
      gameOverMsgRef.current = '';
      // clear pending countdown if any
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      countdownValueRef.current = 0;
      isCountingRef.current = false;
      canRestartRef.current = false;
      // stop any game-over sounds when resetting
      try {
        if (gameOverSoundRef1.current) { gameOverSoundRef1.current.pause(); gameOverSoundRef1.current.currentTime = 0; }
      } catch (e) {}
      try {
        if (gameOverSoundRef2.current) { gameOverSoundRef2.current.pause(); gameOverSoundRef2.current.currentTime = 0; }
      } catch (e) {}
      // hide amitabh image immediately on reset
      try {
        showAmitabhRef.current = false;
        amitabhOpacityRef.current = 0;
        amitabhFadingRef.current = false;
        amitabhFadeStartRef.current = 0;
        amitabhStartTimeRef.current = 0;
      } catch (e) {}
    };

    // ✅ Bird jump
    const jump = () => {
      if (!isGameStartedRef.current && !isGameOverRef.current) startGame();
      else if (!isGameOverRef.current) birdVelocity = lift;
    };

    // ✅ Draw loop
    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw);
      const vw = viewWidthRef.current;
      const vh = viewHeightRef.current;
      ctx.clearRect(0, 0, vw, vh);

      // Background move
      bgX -= gameSpeed;
      if (bgX <= -vw) bgX = 0;
      ctx.drawImage(bg, bgX, 0, vw, vh);
      ctx.drawImage(bg, bgX + vw, 0, vw, vh);

      // Start screen: show title + golden start button when game not started
      if (!isGameStartedRef.current && !isGameOverRef.current) {
        drawStartScreen();
        return;
      }

      // Bird physics
      birdVelocity += gravity;
      birdY += birdVelocity;
      ctx.drawImage(bird, birdX, birdY, birdWidth, birdHeight);

      // Generate pipes
      if (pipes.length === 0 || pipes[pipes.length - 1].x < vw - pipeDistance) {
        createPipe();
      }

      // Draw pipes + move + collision
      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= gameSpeed;
        // draw top and bottom
        ctx.drawImage(pipe, p.x, p.y, pipeWidth, 300);
        ctx.drawImage(pipe, p.x, p.y + 300 + pipeGap, pipeWidth, 300);

        // Remove pipe when off-screen
        if (p.x + pipeWidth < 0) {
          pipes.splice(i, 1);
          // update both ref and React state
          scoreRef.current += 1;
          setScore(scoreRef.current);
          // increase speed by 2% for every 10 pipes crossed
          const increments = Math.floor(scoreRef.current / 10);
          gameSpeed = baseSpeed * (1 + 0.02 * increments);
          continue;
        }

        // Collision (use birdWidth/Height)
        const hitPadding = 4;
        const birdRight = birdX + birdWidth - hitPadding;
        const birdLeft = birdX + hitPadding;
        const birdTop = birdY + hitPadding;
        const birdBottom = birdY + birdHeight - hitPadding;
        const pipeTop = p.y + 300;
        const pipeBottom = p.y + 300 + pipeGap;

        const hitsPipe =
          birdRight > p.x &&
          birdLeft < p.x + pipeWidth &&
          (birdTop < pipeTop || birdBottom > pipeBottom);

        if ((hitsPipe && !startInvulnerableRef.current) || birdBottom >= vh - 10) {
          endGame('PLAYER HAS OUT');
          break;
        }
      }

      // Draw amitabh image (when requested). It should appear at bottom center with a
      // small shake/bounce effect while visible. If the audio ended an ongoing fade will
      // reduce opacity until it disappears smoothly.
      try {
        if (showAmitabhRef.current && amitabhImgRef.current && amitabhImgRef.current.complete) {
          const now = performance.now();
          const img = amitabhImgRef.current;
          const imgNaturalW = img.naturalWidth || 200;
          const imgNaturalH = img.naturalHeight || 100;
          // target display width (responsive)
          const imgW = Math.min(220, Math.round(viewWidthRef.current * 0.4));
          const scale = imgW / imgNaturalW;
          const imgH = Math.round(imgNaturalH * scale);
          const baseX = Math.round(viewWidthRef.current / 2 - imgW / 2);
          const baseY = Math.round(viewHeightRef.current - imgH - 10);

          // wobble/bounce using small sin offsets (not too fast)
          const t = (now - (amitabhStartTimeRef.current || now));
          const offsetX = Math.sin(t * 0.04) * 6; // horizontal shake
          const offsetY = Math.sin(t * 0.05) * 8; // vertical bounce

          // handle fade-out if requested
          if (amitabhFadingRef.current) {
            const elapsed = now - (amitabhFadeStartRef.current || now);
            const dur = amitabhFadeDurationRef.current || 400;
            const alpha = Math.max(0, 1 - elapsed / dur);
            amitabhOpacityRef.current = alpha;
            if (alpha <= 0) {
              showAmitabhRef.current = false;
              amitabhFadingRef.current = false;
            }
          }

          ctx.save();
          ctx.globalAlpha = amitabhOpacityRef.current;
          ctx.drawImage(img, baseX + offsetX, baseY + offsetY, imgW, imgH);
          ctx.restore();
        }
      } catch (e) {}

      // ✅ Game Over Text (draw only)
      if (isGameOverRef.current) {
        ctx.fillStyle = "red";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        const msg = gameOverMsgRef.current || 'GAME OVER';
        ctx.fillText(msg, vw / 2, vh / 2);

        // draw countdown under the message when counting or when 1 is ready to allow restart
        if (isCountingRef.current || canRestartRef.current) {
          const count = isCountingRef.current ? countdownValueRef.current : 1;
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 56px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(count), vw / 2, vh / 2 + 70);
        }

        return;
      }

      // ✅ Score Display (draw 2D badge with background)
      const scoreText = String(scoreRef.current || 0);
      ctx.font = "20px 'Segoe UI', sans-serif";
      const paddingX = 12;
      const paddingY = 6;
      const textMetrics = ctx.measureText(scoreText);
      const textWidth = textMetrics.width;
      const boxWidth = textWidth + paddingX * 2;
      const boxHeight = 24 + paddingY * 2;
      const boxX = vw - boxWidth - 20;
      const boxY = 20;

      // rounded rect background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(boxX + radius, boxY);
      ctx.lineTo(boxX + boxWidth - radius, boxY);
      ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
      ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
      ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
      ctx.lineTo(boxX + radius, boxY + boxHeight);
      ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
      ctx.lineTo(boxX, boxY + radius);
      ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
      ctx.closePath();
      ctx.fill();

      // text
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "20px 'Segoe UI', sans-serif";
      ctx.fillText(scoreText, boxX + boxWidth / 2, boxY + boxHeight / 2);
    };

    // If images already ready (cache), render our custom start screen immediately
    if (imagesReadyRef.current) {
      try {
        drawStartScreen();
      } catch (e) {}
    }

    // ✅ Events
    // helper to unlock audio playback on first user gesture (needed on many mobile/desktop browsers)
    const unlockAudio = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;
      try {
        // attempt to play/pause quickly to satisfy autoplay policies
        gameMusicRef.current.play().then(() => { gameMusicRef.current.pause(); gameMusicRef.current.currentTime = 0; }).catch(() => {});
        gameOverSoundRef1.current.play().then(() => { gameOverSoundRef1.current.pause(); gameOverSoundRef1.current.currentTime = 0; }).catch(() => {});
        gameOverSoundRef2.current.play().then(() => { gameOverSoundRef2.current.pause(); gameOverSoundRef2.current.currentTime = 0; }).catch(() => {});
      } catch (e) {}
    };

    // named handlers so we can remove them on cleanup
    const keyHandler = (e) => {
      // throttle very fast inputs to avoid re-entrant start/reset calls
      const now = Date.now();
      if (now - lastInputTimeRef.current < 150) return;
      lastInputTimeRef.current = now;
      unlockAudio();
      // if game over: only allow restart after countdown finished (canRestartRef)
      if (isGameOverRef.current) {
        if (!canRestartRef.current) {
          // ignore inputs while counting
          return;
        }
        if (invulTimeoutRef.current) { clearTimeout(invulTimeoutRef.current); invulTimeoutRef.current = null; }
        resetGame();
        startGame();
        return;
      }
      // otherwise normal controls: Space to jump or start
      if (e.code === "Space") jump();
    };
    const clickHandler = (ev) => {
      // throttle very fast inputs to avoid re-entrant start/reset calls
      const now = Date.now();
      if (now - lastInputTimeRef.current < 150) return;
      lastInputTimeRef.current = now;
      unlockAudio();
      if (isGameOverRef.current) {
        if (!canRestartRef.current) {
          // ignore clicks while counting
          return;
        }
        if (invulTimeoutRef.current) { clearTimeout(invulTimeoutRef.current); invulTimeoutRef.current = null; }
        resetGame();
        startGame();
        return;
      }
      // If game not started, only start when clicking the golden start button
      if (!isGameStartedRef.current) {
        try {
          const rect = canvas.getBoundingClientRect();
          const clientX = ev.clientX ?? (ev.touches && ev.touches[0] && ev.touches[0].clientX) ?? (ev.changedTouches && ev.changedTouches[0] && ev.changedTouches[0].clientX);
          const clientY = ev.clientY ?? (ev.touches && ev.touches[0] && ev.touches[0].clientY) ?? (ev.changedTouches && ev.changedTouches[0] && ev.changedTouches[0].clientY);
          const x = Math.round(clientX - rect.left);
          const y = Math.round(clientY - rect.top);
          const b = startButtonRef.current;
          if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            // user clicked the start button — ensure audio unlocked and then start
            unlockAudio();
            // try to play music explicitly on user gesture
            try { gameMusicRef.current.currentTime = 0; gameMusicRef.current.play().catch(()=>{}); } catch(e) {}
            startGame();
          }
        } catch (e) {
          // fallback — start if any issue with hit detection
          startGame();
        }
        return;
      }
      jump();
    };
    document.addEventListener("keydown", keyHandler);
    canvas.addEventListener("click", clickHandler);
    canvas.addEventListener("touchstart", clickHandler, { passive: true });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener("keydown", keyHandler);
      canvas.removeEventListener("click", clickHandler);
      canvas.removeEventListener("touchstart", clickHandler);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      try {
        if (gameMusicRef.current) gameMusicRef.current.pause();
      } catch (err) {}
      if (invulTimeoutRef.current) {
        clearTimeout(invulTimeoutRef.current);
        invulTimeoutRef.current = null;
      }
      // clear pending countdown interval if any
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      try {
        if (gameOverSoundRef1.current) { gameOverSoundRef1.current.pause(); gameOverSoundRef1.current.currentTime = 0; }
      } catch (e) {}
      try {
        if (gameOverSoundRef2.current) { gameOverSoundRef2.current.pause(); gameOverSoundRef2.current.currentTime = 0; }
      } catch (e) {}
    };
    // run once on mount
  }, []);

  return (
    <div className="game-container">
      <canvas ref={canvasRef} width="700" height="500"></canvas>
    </div>
  );
}
