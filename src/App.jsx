import React, { useState, useEffect } from 'react';
import './App.css';

const Square = ({ value, onClick, winningSquare }) => {
  const squareClass = `square ${value?.toLowerCase() || ''} ${winningSquare ? 'winning' : ''}`;
  
  return (
    <button className={squareClass} onClick={onClick}>
      {value}
    </button>
  );
};

const Board = ({ squares, onClick, winningLine }) => {
  const renderSquare = (i) => {
    const isWinningSquare = winningLine && winningLine.includes(i);
    
    return (
      <Square
        key={i}
        value={squares[i]}
        onClick={() => onClick(i)}
        winningSquare={isWinningSquare}
      />
    );
  };

  return (
    <div className="board">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => renderSquare(i))}
    </div>
  );
};

function App() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [stepNumber, setStepNumber] = useState(0);
  const [xIsNext, setXIsNext] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState('two-player'); // 'two-player' or 'bot'
  const [aiThinking, setAiThinking] = useState(false);
  const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
  const [score, setScore] = useState(0);
  
  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    
    return null;
  };
  
  const current = history[stepNumber];
  const winInfo = calculateWinner(current);
  const winner = winInfo?.winner;
  const winningLine = winInfo?.line;
  const isBoardFull = current.every(square => square !== null);
  
  const handleClick = (i) => {
    // Prevent clicks during AI thinking
    if (aiThinking) return;
    
    const historyPoint = history.slice(0, stepNumber + 1);
    const currentBoard = historyPoint[historyPoint.length - 1];
    const squares = [...currentBoard];
    
    // Return if won or square is already filled
    if (winner || squares[i]) return;
    
    if (!isGameStarted) {
      setIsGameStarted(true);
    }
    
    // Select square
    squares[i] = xIsNext ? 'X' : 'O';
    
    setHistory([...historyPoint, squares]);
    setStepNumber(historyPoint.length);
    setXIsNext(!xIsNext);
  };
  
  const makeSmartMove = (availableMoves) => {
    // 1. Check if AI can win in the next move
    for (let i of availableMoves) {
      const boardCopy = [...current];
      boardCopy[i] = 'O';
      const result = calculateWinner(boardCopy);
      if (result && result.winner === 'O') {
        return handleClick(i);
      }
    }
    
    // 2. Check if player can win in the next move and block
    for (let i of availableMoves) {
      const boardCopy = [...current];
      boardCopy[i] = 'X';
      const result = calculateWinner(boardCopy);
      if (result && result.winner === 'X') {
        return handleClick(i);
      }
    }
    
    // 3. Take center if available
    if (availableMoves.includes(4)) {
      return handleClick(4);
    }
    
    // 4. Take corners if available
    const corners = [0, 2, 6, 8].filter(corner => availableMoves.includes(corner));
    if (corners.length > 0) {
      return handleClick(corners[Math.floor(Math.random() * corners.length)]);
    }
    
    // 5. Take edges if available
    const edges = [1, 3, 5, 7].filter(edge => availableMoves.includes(edge));
    if (edges.length > 0) {
      return handleClick(edges[Math.floor(Math.random() * edges.length)]);
    }
    
    // This should never be reached, but as a fallback use random move
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    const randomMove = availableMoves[randomIndex];
    handleClick(randomMove);
  };
  
  const makeAIMove = () => {
    const availableMoves = current.map((square, i) => square === null ? i : null).filter(i => i !== null);
    
    // No available moves
    if (availableMoves.length === 0) return;

    // Easy mode: Just make random moves
    if (difficulty === 'easy') {
      // Random move with 20% chance of making a smart move
      if (Math.random() < 0.2) {
        // Occasionally make a smart move even on easy
        makeSmartMove(availableMoves);
      } else {
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        const randomMove = availableMoves[randomIndex];
        handleClick(randomMove);
      }
      return;
    }
    
    // Medium mode: Sometimes make mistakes
    if (difficulty === 'medium') {
      // 70% chance of making the optimal move
      if (Math.random() < 0.7) {
        makeSmartMove(availableMoves);
      } else {
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        const randomMove = availableMoves[randomIndex];
        handleClick(randomMove);
      }
      return;
    }
    
    // Hard mode: Always make the best move
    makeSmartMove(availableMoves);
  };
  
  const resetGame = () => {
    setHistory([Array(9).fill(null)]);
    setStepNumber(0);
    setXIsNext(true);
    setIsGameStarted(false);
    setAiThinking(false);
  };
  
  const setMode = (mode) => {
    if (isGameStarted) {
      resetGame();
    }
    setGameMode(mode);
  };
  
  // AI move after player in single player mode
  useEffect(() => {
    if (gameMode === 'bot' && isGameStarted && !winner && !xIsNext && !isBoardFull) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        makeAIMove();
        setAiThinking(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [xIsNext, gameMode, isGameStarted, winner, isBoardFull]);
  
  // Check for game end and update score
  useEffect(() => {
    if (!isGameStarted) return;
    
    if (winner) {
      // Player won (X)
      if (winner === 'X' && gameMode === 'bot') {
        setScore(prevScore => prevScore + 10);
      } 
      // Bot won (O)
      else if (winner === 'O' && gameMode === 'bot') {
        setScore(prevScore => prevScore - 5);
      }
    } else if (isBoardFull) {
      // Game is a draw
      if (gameMode === 'bot') {
        setScore(prevScore => prevScore + 0); // no change for draw
      }
    }
  }, [winner, isBoardFull, isGameStarted, gameMode]);
  
  let statusText;
  let statusClass = "status";
  
  if (winner) {
    statusText = (
      <>
        ผู้ชนะ: <span className={`player-indicator player-${winner.toLowerCase()}`}>{winner}</span>
      </>
    );
    statusClass += " winner";
  } else if (isBoardFull) {
    statusText = "เกมเสมอ!";
    statusClass += " draw";
  } else if (aiThinking) {
    statusText = "บอทกำลังคิด...";
  } else {
    statusText = (
      <>
        ตาของผู้เล่น: <span className={`player-indicator player-${xIsNext ? 'x' : 'o'}`}>{xIsNext ? 'X' : 'O'}</span>
      </>
    );
  }
  
  return (
    <>
      <div className="animated-background">
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
        <div className="bubble bubble-4"></div>
        <div className="bubble bubble-5"></div>
        <div className="bubble bubble-6"></div>
        <div className="bubble bubble-7"></div>
        <div className="bubble bubble-8"></div>
        <div className="bubble bubble-9"></div>
        <div className="bubble bubble-10"></div>
        <div className="bubble bubble-11"></div>
        <div className="bubble bubble-12"></div>
        <div className="bubble bubble-13"></div>
        <div className="bubble bubble-14"></div>
        <div className="bubble bubble-15"></div>
      </div>
      <div className={`score-display ${score > 0 ? 'positive' : score < 0 ? 'negative' : 'idle'}`}>
        <span>คะแนน:</span>
        <span className="score-value">{score}</span>
      </div>
      <div className="game">
        <h1 className="game-title">TIC TAC TOE</h1>
        
        <div className="game-controls">
          <div className="mode-controls">
            <button 
              className={`mode-btn ${gameMode === 'two-player' ? 'active' : ''}`} 
              onClick={() => setMode('two-player')}
            >
              เล่น 2 คน
            </button>
            <button 
              className={`mode-btn ${gameMode === 'bot' ? 'active' : ''}`} 
              onClick={() => setMode('bot')}
            >
              เล่นกับบอท
            </button>
          </div>
          
          {gameMode === 'bot' && (
            <div className="difficulty-controls">
              <button 
                className={`diff-btn easy ${difficulty === 'easy' ? 'active' : ''}`} 
                onClick={() => setDifficulty('easy')}
              >
                ง่าย
              </button>
              <button 
                className={`diff-btn medium ${difficulty === 'medium' ? 'active' : ''}`} 
                onClick={() => setDifficulty('medium')}
              >
                ปานกลาง
              </button>
              <button 
                className={`diff-btn hard ${difficulty === 'hard' ? 'active' : ''}`} 
                onClick={() => setDifficulty('hard')}
              >
                ยาก
              </button>
            </div>
          )}
        </div>
        
        <div className={statusClass}>{statusText}</div>
        
        <Board 
          squares={current} 
          onClick={handleClick}
          winningLine={winningLine}
        />
        
        <button 
          className="reset-button" 
          onClick={resetGame}
        >
          เริ่มเกมใหม่
        </button>
        
        {gameMode === 'bot' && (
          <div className="footer">
            {difficulty === 'easy' ? "โหมดง่าย: " : 
             difficulty === 'medium' ? "โหมดปานกลาง: " : 
             "โหมดยาก: "}
            คุณเล่นเป็น X, บอทเล่นเป็น O
            <br />
            <span className="score-info">ชนะ: +10, เสมอ: +0, แพ้: -5</span>
          </div>
        )}
        
        {gameMode === 'two-player' && (
          <div className="footer">
            ผู้เล่น 1: X, ผู้เล่น 2: O
          </div>
        )}
      </div>
    </>
  );
}

export default App;