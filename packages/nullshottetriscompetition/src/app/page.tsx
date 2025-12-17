'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// Tetris piece shapes
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000'
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const boardRef = useRef<number[][]>(Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)));
  const currentPieceRef = useRef<any>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">
      {/* Enhanced animated aurora background layers */}
      <div className="absolute inset-0 bg-aurora-layer-1" />
      <div className="absolute inset-0 bg-aurora-layer-2" />
      <div className="absolute inset-0 bg-aurora-layer-3" />
      
      {/* Floating particles overlay */}
      <div className="absolute inset-0 bg-particles" />
      
      {/* Main content - centered */}
      <main className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        <h1 className="text-center text-[clamp(28px,6vw,64px)] font-medium tracking-tight mb-4">
          Turn Chats into Apps
        </h1>
        
        {/* Rotating slogans */}
        <div className="mt-4 h-8 md:h-10 overflow-hidden flex items-center justify-center">
          <span
            className={`inline-block text-center text-[clamp(18px,3vw,32px)] font-light transition-all duration-[400ms] ease-in-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          >
            {slogans[currentIndex]}
          </span>
        </div>
      </main>
      
      {/* Start Prompting arrow pointing left - bottom left */}
      <div className="absolute left-6 md:left-8 bottom-[5%] z-20 flex items-center gap-3 arrow-point-left">
        <div className="flex items-center gap-2 text-white/80 font-medium text-sm md:text-base">
          <svg 
            className="w-5 h-5 md:w-6 md:h-6 animate-bounce-horizontal" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Start prompting</span>
        </div>
      </div>
    </div>
  );
}


