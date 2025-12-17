'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const SHAPES: Record<string, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS: Record<string, string> = {
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

type Piece = {
  shape: number[][];
  type: string;
  x: number;
  y: number;
};

function createPiece(): Piece {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    shape: SHAPES[type],
    type,
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(SHAPES[type][0].length / 2),
    y: 0
  };
}

function rotate(piece: Piece): Piece {
  const newShape = piece.shape[0].map((_, i) =>
    piece.shape.map(row => row[i]).reverse()
  );
  return { ...piece, shape: newShape };
}

export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const boardRef = useRef<string[][]>(Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => '')));
  const currentPieceRef = useRef<Piece | null>(null);
  const dropCounterRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const collides = (piece: Piece, board: string[][]): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || (newY >= 0 && board[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const merge = (piece: Piece, board: string[][]) => {
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;
          if (boardY >= 0) {
            board[boardY][boardX] = piece.type;
          }
        }
      });
    });
  };

  const clearLines = (board: string[][]): number => {
    let linesCleared = 0;
    outer: for (let y = board.length - 1; y >= 0; y--) {
      for (let x = 0; x < board[y].length; x++) {
        if (!board[y][x]) continue outer;
      }
      board.splice(y, 1);
      board.unshift(Array.from({ length: BOARD_WIDTH }, () => ''));
      linesCleared++;
      y++;
    }
    return linesCleared;
  };

  const drop = useCallback(() => {
    if (!currentPieceRef.current || gameOver) return;
    
    const piece = currentPieceRef.current;
    piece.y++;
    
    if (collides(piece, boardRef.current)) {
      piece.y--;
      merge(piece, boardRef.current);
      
      const cleared = clearLines(boardRef.current);
      if (cleared > 0) {
        setLines(prev => {
          const newLines = prev + cleared;
          setLevel(Math.floor(newLines / 10) + 1);
          return newLines;
        });
        setScore(prev => prev + cleared * 100 * level);
      }
      
      currentPieceRef.current = createPiece();
      if (collides(currentPieceRef.current, boardRef.current)) {
        setGameOver(true);
      }
    }
  }, [gameOver, level]);

  const move = useCallback((dir: number) => {
    if (!currentPieceRef.current || gameOver) return;
    currentPieceRef.current.x += dir;
    if (collides(currentPieceRef.current, boardRef.current)) {
      currentPieceRef.current.x -= dir;
    }
  }, [gameOver]);

  const rotatePiece = useCallback(() => {
    if (!currentPieceRef.current || gameOver) return;
    const rotated = rotate(currentPieceRef.current);
    if (!collides(rotated, boardRef.current)) {
      currentPieceRef.current = rotated;
    }
  }, [gameOver]);

  const hardDrop = useCallback(() => {
    if (!currentPieceRef.current || gameOver) return;
    while (!collides({ ...currentPieceRef.current, y: currentPieceRef.current.y + 1 }, boardRef.current)) {
      currentPieceRef.current.y++;
    }
    drop();
  }, [gameOver, drop]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blockSize = Math.min(canvas.width / BOARD_WIDTH, canvas.height / BOARD_HEIGHT);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    boardRef.current.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          ctx.fillStyle = COLORS[value];
          ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
        }
      });
    });
    
    if (currentPieceRef.current) {
      const piece = currentPieceRef.current;
      ctx.fillStyle = COLORS[piece.type];
      piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            ctx.fillRect((piece.x + x) * blockSize, (piece.y + y) * blockSize, blockSize - 1, blockSize - 1);
          }
        });
      });
    }
  };

  const update = (time = 0) => {
    if (gameOver) return;
    
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    
    dropCounterRef.current += deltaTime;
    const dropInterval = 1000 - (level - 1) * 50;
    
    if (dropCounterRef.current > dropInterval) {
      drop();
      dropCounterRef.current = 0;
    }
    
    draw();
    animationFrameRef.current = requestAnimationFrame(update);
  };

  const startGame = () => {
    boardRef.current = Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => ''));
    currentPieceRef.current = createPiece();
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setGameStarted(true);
    dropCounterRef.current = 0;
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(update);
  };

  const resetGame = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startGame();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          move(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          drop();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStarted, gameOver, level, move, drop, rotatePiece, hardDrop]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-4 overflow-hidden">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center">TETRIS</h1>
      
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="bg-black/50 p-4 rounded-lg backdrop-blur-sm">
          <canvas
            ref={canvasRef}
            width={BOARD_WIDTH * 30}
            height={BOARD_HEIGHT * 30}
            className="border-4 border-purple-500 rounded"
          />
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="bg-black/50 p-6 rounded-lg backdrop-blur-sm text-white min-w-[200px]">
            <div className="mb-4">
              <div className="text-sm text-gray-400">Score</div>
              <div className="text-3xl font-bold">{score}</div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-gray-400">Level</div>
              <div className="text-2xl font-bold">{level}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Lines</div>
              <div className="text-2xl font-bold">{lines}</div>
            </div>
          </div>
          
          {!gameStarted && (
            <button
              onClick={startGame}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Start Game
            </button>
          )}
          
          {gameOver && (
            <div className="bg-red-900/80 p-6 rounded-lg backdrop-blur-sm text-white text-center">
              <div className="text-2xl font-bold mb-4">Game Over!</div>
              <button
                onClick={resetGame}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
          
          <div className="bg-black/50 p-4 rounded-lg backdrop-blur-sm text-white text-sm">
            <div className="font-bold mb-2">Controls</div>
            <div className="space-y-1 text-gray-300">
              <div>← → Move</div>
              <div>↑ Rotate</div>
              <div>↓ Soft Drop</div>
              <div>Space Hard Drop</div>
            </div>
          </div>
        </div>
      </div>
      
      {gameStarted && !gameOver && (
        <div className="mt-6 flex gap-3 md:hidden">
          <button
            onClick={() => move(-1)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-2xl"
          >
            ←
          </button>
          <button
            onClick={() => drop()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-2xl"
          >
            ↓
          </button>
          <button
            onClick={rotatePiece}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-2xl"
          >
            ↻
          </button>
          <button
            onClick={() => move(1)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-2xl"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}


















