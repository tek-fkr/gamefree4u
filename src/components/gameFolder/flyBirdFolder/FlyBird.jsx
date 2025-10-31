import React, { useEffect, useRef, useState } from "react";
import "./FlyBird.css";

import bgImg from "../media/bg.jpg";
import birdImg from "../media/image.jpg";
import pipeImg from "../media/pipe.png";
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
          // show intro when images ready
          try {
            ctx.clearRect(0, 0, viewWidthRef.current, viewHeightRef.current);
            bgX = 0;
            ctx.drawImage(bg, bgX, 0, viewWidthRef.current, viewHeightRef.current);
            ctx.drawImage(bg, bgX + viewWidthRef.current, 0, viewWidthRef.current, viewHeightRef.current);
            ctx.fillStyle = "white";
            ctx.font = "bold 32px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Tap or Press Space to Start", viewWidthRef.current / 2, viewHeightRef.current / 2);
          } catch (e) {}
        }
      }
    };

    bg.onload = onImageLoad;
    bird.onload = onImageLoad;
    pipe.onload = onImageLoad;

    bg.src = bgImg;
    bird.src = birdImg;
    pipe.src = pipeImg;

    // Load sounds (store in refs so we have single instances)
    gameMusicRef.current = new Audio(gameMusicFile);
    gameMusicRef.current.loop = true;
    gameOverSoundRef1.current = new Audio(gameOverFile);
    gameOverSoundRef2.current = new Audio(gameOverFile2);

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
  // pipe gap scales with bird size so larger bird gets a fairer gap
  const pipeGap = Math.max(90, Math.round(birdHeight * 2.5));
    const pipeWidth = 50;
    const pipeDistance = 250;

  const baseSpeed = 1.5; // starting (easier) speed for first rounds
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
      // if starting invulnerable, spawn the first pipe further to the right so it won't collide immediately
      const extraSpawnOffset = startInvulnerableRef.current && pipes.length === 0 ? 240 : 0;
      pipes.push({ x: vw + extraSpawnOffset, y: topY });
    };

    // ✅ Start game
    const startGame = () => {
      if (isGameStartedRef.current) return;
      // update refs and React state
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
      gameSpeed = 2.5;

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

      // Tap to start
      if (!isGameStartedRef.current && !isGameOverRef.current) {
        ctx.fillStyle = "white";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Tap or Press Space to Start", vw / 2, vh / 2);
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
          // speed progression based on how many pipes crossed
          if (scoreRef.current >= 20) gameSpeed = baseSpeed * 1.04;
          else if (scoreRef.current >= 7) gameSpeed = baseSpeed * 1.02;
          else gameSpeed = baseSpeed;
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

    // If images already ready (cache), render intro immediately
    if (imagesReadyRef.current) {
      try {
        ctx.clearRect(0, 0, viewWidthRef.current, viewHeightRef.current);
        bgX = 0;
        ctx.drawImage(bg, bgX, 0, viewWidthRef.current, viewHeightRef.current);
        ctx.drawImage(bg, bgX + viewWidthRef.current, 0, viewWidthRef.current, viewHeightRef.current);
        ctx.fillStyle = "white";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Tap or Press Space to Start", viewWidthRef.current / 2, viewHeightRef.current / 2);
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
