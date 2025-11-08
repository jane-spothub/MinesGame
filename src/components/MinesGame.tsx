import React, { useState, useCallback, useEffect } from 'react';
import CanvasBoard from './CanvasBoard';
import GameControls from './GameControls';
import '../styles/mines.css';
import type {Cell, GameState} from "../types/game.ts";

const GRID_SIZE = 5;

const INITIAL_STATE: GameState = {
    board: [],
    bombs: 3,
    revealed: 0,
    gameStatus: 'idle',
    level: 'easy',
    betAmount: 20,
    multiplier: 1.00,
    totalWinnings: 0,
    balance: 1000
};

const MinesGame: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
    const [showAllCells, setShowAllCells] = useState(false); // New state for cashout reveal

    const getBombsCount = useCallback((level: string): number => {
        switch (level) {
            case 'easy': return 3;
            case 'medium': return 5;
            case 'hard': return 8;
            default: return 3;
        }
    }, []);

    const initializeBoard = useCallback((): Cell[] => {
        const totalCells = GRID_SIZE * GRID_SIZE;
        const bombsCount = getBombsCount(gameState.level);
        const board: Cell[] = [];

        // Create empty board
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                board.push({
                    x,
                    y,
                    isBomb: false,
                    isRevealed: false,
                    isFlagged: false
                });
            }
        }

        // Place bombs randomly
        let bombsPlaced = 0;
        while (bombsPlaced < bombsCount) {
            const randomIndex = Math.floor(Math.random() * totalCells);
            if (!board[randomIndex].isBomb) {
                board[randomIndex].isBomb = true;
                bombsPlaced++;
            }
        }

        return board;
    }, [gameState.level, getBombsCount]);

    const startGame = useCallback(() => {
        if (gameState.balance < gameState.betAmount) return;

        const newBoard = initializeBoard();

        setGameState(prev => ({
            ...prev,
            board: newBoard,
            gameStatus: 'playing',
            revealed: 0,
            multiplier: 1.00,
            totalWinnings: 0,
            balance: prev.balance - prev.betAmount
        }));

        // Ensure cells are hidden when starting new game
        setShowAllCells(false);
    }, [gameState.balance, gameState.betAmount, initializeBoard]);

    const resetToIdleState = useCallback(() => {
        const newBoard = initializeBoard();
        setGameState(prev => ({
            ...prev,
            board: newBoard,
            gameStatus: 'idle',
            revealed: 0,
            multiplier: 1.00
        }));
        setShowAllCells(false);
    }, [initializeBoard]);

    const revealCell = useCallback((cellIndex: number) => {
        if (gameState.gameStatus !== 'playing' || showAllCells) return; // Don't allow clicks during reveal phase

        setGameState(prev => {
            const newBoard = [...prev.board];
            const cell = newBoard[cellIndex];

            if (cell.isRevealed || cell.isFlagged) return prev;

            // Reveal the cell
            cell.isRevealed = true;
            const newRevealed = prev.revealed + 1;

            let newGameStatus = prev.gameStatus;
            let newMultiplier = prev.multiplier;
            let newTotalWinnings = prev.totalWinnings;
            let newBalance = prev.balance;

            if (cell.isBomb) {
                // Game over - hit a bomb
                newGameStatus = 'lose';
                newTotalWinnings = 0;

                // Show all cells temporarily when bomb is clicked
                setShowAllCells(true);

                // After 2 seconds, reset to idle state with fresh board
                setTimeout(() => {
                    resetToIdleState();
                }, 2000);

            } else {
                // Safe cell revealed
                const bombsCount = getBombsCount(prev.level);
                const safeCells = (GRID_SIZE * GRID_SIZE) - bombsCount;
                const risk = newRevealed / safeCells;

                // Calculate multiplier based on risk and level
                const baseMultiplier = prev.level === 'easy' ? 1.2 : prev.level === 'medium' ? 1.5 : 2.0;
                newMultiplier = Number((baseMultiplier * (1 + risk)).toFixed(2));

                // Check for win
                if (newRevealed === safeCells) {
                    newGameStatus = 'win';
                    newTotalWinnings = prev.betAmount * newMultiplier;
                    newBalance = prev.balance + newTotalWinnings;

                    // Show all cells temporarily when player wins
                    setShowAllCells(true);

                    // After 2 seconds, reset to idle state with fresh board
                    setTimeout(() => {
                        resetToIdleState();
                    }, 2000);
                }
            }

            return {
                ...prev,
                board: newBoard,
                revealed: newRevealed,
                gameStatus: newGameStatus,
                multiplier: newMultiplier,
                totalWinnings: newTotalWinnings,
                balance: newBalance
            };
        });
    }, [gameState.gameStatus, getBombsCount, showAllCells, resetToIdleState]);

    const cashOut = useCallback(() => {
        if (gameState.gameStatus !== 'playing' || gameState.revealed === 0) return;

        const winnings = gameState.betAmount * gameState.multiplier;

        // Show all cells temporarily
        setShowAllCells(true);

        // After 2 seconds, reset to idle state with fresh board
        setTimeout(() => {
            setGameState(prev => {
                const newBoard = initializeBoard();
                return {
                    ...prev,
                    board: newBoard,
                    gameStatus: 'idle',
                    revealed: 0,
                    multiplier: 1.00,
                    totalWinnings: winnings,
                    balance: prev.balance + winnings
                };
            });
            setShowAllCells(false);
        }, 2000);

    }, [gameState.gameStatus, gameState.revealed, gameState.betAmount, gameState.multiplier, initializeBoard]);

    const changeLevel = useCallback((level: 'easy' | 'medium' | 'hard') => {
        setGameState(prev => {
            const newBoard = initializeBoard();
            return {
                ...prev,
                level,
                bombs: getBombsCount(level),
                board: newBoard,
                revealed: 0,
                multiplier: 1.00
            };
        });
    }, [getBombsCount, initializeBoard]);

    const changeBetAmount = useCallback((amount: number) => {
        setGameState(prev => ({
            ...prev,
            betAmount: amount
        }));
    }, []);

    const adjustBetAmount = useCallback((increment: boolean) => {
        setGameState(prev => {
            const betAmounts = [20, 50, 100, 500, 1000];
            const currentIndex = betAmounts.indexOf(prev.betAmount);
            let newIndex;

            if (increment) {
                newIndex = Math.min(currentIndex + 1, betAmounts.length - 1);
            } else {
                newIndex = Math.max(currentIndex - 1, 0);
            }

            return {
                ...prev,
                betAmount: betAmounts[newIndex]
            };
        });
    }, []);

    const resetGame = useCallback(() => {
        setGameState(INITIAL_STATE);
        setShowAllCells(false);
    }, []);

    // Initialize board on mount
    useEffect(() => {
        const newBoard = initializeBoard();
        setGameState(prev => ({ ...prev, board: newBoard }));
    }, [initializeBoard]);

    return (
        <div className="mines-game">
            <div className="game-header">
                <div className="title-section">
                    <h1 className="game-title">MINES</h1>
                    <div className="balance-section">
                        <span className="balance-label">BALANCE</span>
                        <span className="balance-amount">{gameState.balance.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="game-layout">
                <div className="right-panel">
                    <CanvasBoard
                        board={gameState.board}
                        onRevealCell={revealCell}
                        gameStatus={gameState.gameStatus}
                        showAllCells={showAllCells}
                    />
                </div>
                <div className="left-panel">
                    <GameControls
                        gameState={gameState}
                        onStart={startGame}
                        onCashOut={cashOut}
                        onReset={resetGame}
                        onChangeLevel={changeLevel}
                        onChangeBet={changeBetAmount}
                        onAdjustBet={adjustBetAmount}
                    />
                </div>
            </div>
        </div>
    );
};

export default MinesGame;