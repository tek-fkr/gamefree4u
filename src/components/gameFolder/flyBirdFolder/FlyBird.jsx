import React, { useEffect, useRef, useState } from "react";
import "./FlyBird.css";

import bgImg from "../media/bg.jpg";
import birdImg from "../media/image.jpg";
import pipeImg from "../media/pipe.png";
import gameMusicFile from "../media/modi.mp3";
import gameOverFile from "../media/memeGirl.mp3";

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
  const gameOverSoundRef = useRef(null);
  const gameOverMsgRef = useRef('');
  const startInvulnerableRef = useRef(false);
  const invulTimeoutRef = useRef(null);
  const firstOutRef = useRef(false); // track if we've skipped the gameOver sound once

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Load images
    const bg = new Image();
    bg.src = bgImg;
    const bird = new Image();
    bird.src = birdImg;
    const pipe = new Image();
    pipe.src = pipeImg;

  // Load sounds (store in refs so we have single instances)
  gameMusicRef.current = new Audio(gameMusicFile);
  gameMusicRef.current.loop = true;
  gameOverSoundRef.current = new Audio(gameOverFile);

    // Bird physics
    let birdX = 60;
    let birdY = 200;
    let birdVelocity = 0;
  // increased bird size for better visibility
  const birdWidth = 68; // was 34
  const birdHeight = 48; // was 24
  const gravity = 0.4;
  const lift = -6;

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
      // center the gap roughly around the vertical center of the canvas with a small random offset
      const gapCenter = canvas.height / 2 + (Math.random() * 100 - 50); // +/-50px
      // top pipe y so that the gap is centered at gapCenter
      const topY = Math.floor(gapCenter - pipeGap / 2 - 300); // 300 is pipe image height
      // if starting invulnerable, spawn the first pipe further to the right so it won't collide immediately
      const extraSpawnOffset = startInvulnerableRef.current && pipes.length === 0 ? 240 : 0;
      pipes.push({ x: canvas.width + extraSpawnOffset, y: topY });
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

      birdY = 200;
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

      // give a short invulnerability window to avoid instant-out on the first pipe
      startInvulnerableRef.current = true;
      if (invulTimeoutRef.current) clearTimeout(invulTimeoutRef.current);
      // slightly longer grace to be more forgiving
      invulTimeoutRef.current = setTimeout(() => {
        startInvulnerableRef.current = false;
        invulTimeoutRef.current = null;
      }, 800);

      draw();
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

      // play game over sound, but skip the first-out sound once if not played before
      if (!firstOutRef.current) {
        // mark that we've now skipped the first-out sound
        firstOutRef.current = true;
      } else {
        try {
          gameOverSoundRef.current.currentTime = 0;
          gameOverSoundRef.current.play();
        } catch (err) {}
      }
    };

    // ✅ Restart game after 3 seconds
    const resetGame = () => {
      isGameStartedRef.current = false;
      isGameOverRef.current = false;
      setIsGameStarted(false);
      setIsGameOver(false);
      scoreRef.current = 0;
      setScore(0);
      birdY = 200;
      birdVelocity = 0;
      pipes = [];
      bgX = 0;
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
      gameOverMsgRef.current = '';
    };

    // ✅ Bird jump
    const jump = () => {
      if (!isGameStartedRef.current && !isGameOverRef.current) startGame();
      else if (!isGameOverRef.current) birdVelocity = lift;
    };

    // ✅ Draw loop
    const draw = () => {
  animationIdRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background move
      bgX -= gameSpeed;
      if (bgX <= -canvas.width) bgX = 0;
      ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
      ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);

      // Tap to start
      if (!isGameStartedRef.current && !isGameOverRef.current) {
        ctx.fillStyle = "white";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Tap or Press Space to Start", canvas.width / 2, canvas.height / 2);
        return;
      }

      // Bird physics
  birdVelocity += gravity;
  birdY += birdVelocity;
  ctx.drawImage(bird, birdX, birdY, birdWidth, birdHeight);

      // Generate pipes
      if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeDistance) {
        createPipe();
      }

      // Draw pipes + move + collision
      pipes.forEach((p, i) => {
        ctx.drawImage(pipe, p.x, p.y, pipeWidth, 300);
        ctx.drawImage(pipe, p.x, p.y + 300 + pipeGap, pipeWidth, 300);
        p.x -= gameSpeed;

        // Remove pipe when off-screen
          if (p.x + pipeWidth < 0) {
            pipes.splice(i, 1);
            // update both ref and React state
            scoreRef.current += 1;
            setScore(scoreRef.current);
            // speed progression based on how many pipes crossed
            // first 0..6 (<=6) : baseSpeed
            // after 7 pipes: +2% of baseSpeed
            // after 20 pipes: +4% of baseSpeed
            if (scoreRef.current >= 20) gameSpeed = baseSpeed * 1.04;
            else if (scoreRef.current >= 7) gameSpeed = baseSpeed * 1.02;
            else gameSpeed = baseSpeed;
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

        if ((hitsPipe && !startInvulnerableRef.current) || birdBottom >= canvas.height - 10) {
          if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
          endGame('PLAYER HAS OUT');
        }
      });

      // ✅ Game Over Text
      if (isGameOverRef.current) {
        ctx.fillStyle = "red";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        const msg = gameOverMsgRef.current || 'GAME OVER';
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
        // schedule reset once
        setTimeout(() => resetGame(), 3000);
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
      const boxX = canvas.width - boxWidth - 20;
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

    // ✅ Events
    // named handlers so we can remove them on cleanup
    const keyHandler = (e) => {
      if (e.code === "Space") jump();
    };
    const clickHandler = () => jump();
    document.addEventListener("keydown", keyHandler);
    canvas.addEventListener("click", clickHandler);

  // Initial render (draw the intro state)
  draw();

    return () => {
      document.removeEventListener("keydown", keyHandler);
      canvas.removeEventListener("click", clickHandler);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      try {
        if (gameMusicRef.current) gameMusicRef.current.pause();
      } catch (err) {}
      if (invulTimeoutRef.current) {
        clearTimeout(invulTimeoutRef.current);
        invulTimeoutRef.current = null;
      }
    };
    // run once on mount
  }, []);

  return (
    <div className="game-container">
      <canvas ref={canvasRef} width="700" height="500"></canvas>
    </div>
  );
}
