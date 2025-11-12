import React, {useState, useCallback, useEffect} from 'react';
import CanvasBoard from './CanvasBoard';
import GameControls from './GameControls';
import '../styles/mines.css';
import type {Cell, GameState} from "../types/game.ts";
import GameHeader from "./GameHeader.tsx";

const GRID_SIZE = 5;

const INITIAL_STATE: GameState = {
    board: [],
    bombs: 3,
    revealed: 0,
    gameStatus: 'idle',
    level: 'easy',
    betAmount: 10,
    multiplier: 1.00,
    totalWinnings: 0,
    balance: 1000 // Changed from 960 to 1000
};

const MinesGame: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
    const [showAllCells, setShowAllCells] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const getBombsCount = useCallback((level: string): number => {
        switch (level) {
            case 'easy':
                return 3;
            case 'medium':
                return 5;
            case 'hard':
                return 8;
            default:
                return 3;
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
            balance: prev.balance - prev.betAmount // Deduct bet amount from balance
        }));

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
        if (gameState.gameStatus !== 'playing' || showAllCells) return;

        setGameState(prev => {
            const newBoard = [...prev.board];
            const cell = newBoard[cellIndex];

            if (cell.isRevealed || cell.isFlagged) return prev;

            cell.isRevealed = true;
            const newRevealed = prev.revealed + 1;

            let newGameStatus = prev.gameStatus;
            let newMultiplier = prev.multiplier;
            let newTotalWinnings = prev.totalWinnings;
            let newBalance = prev.balance;

            if (cell.isBomb) {
                newGameStatus = 'lose';
                newTotalWinnings = 0;
                setShowAllCells(true);

                setTimeout(() => {
                    resetToIdleState();
                }, 2000);

            } else {
                const bombsCount = getBombsCount(prev.level);
                const safeCells = (GRID_SIZE * GRID_SIZE) - bombsCount;
                const risk = newRevealed / safeCells;

                const baseMultiplier = prev.level === 'easy' ? 1.2 : prev.level === 'medium' ? 1.5 : 2.0;
                newMultiplier = Number((baseMultiplier * (1 + risk)).toFixed(2));

                if (newRevealed === safeCells) {
                    newGameStatus = 'win';
                    newTotalWinnings = prev.betAmount * newMultiplier;
                    newBalance = prev.balance + newTotalWinnings;

                    setShowAllCells(true);

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

        setShowAllCells(true);

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
            const currentBet = prev.betAmount;
            let newBetAmount;

            if (increment) {
                newBetAmount = currentBet + 10;
            } else {
                newBetAmount = Math.max(10, currentBet - 10); // Minimum bet is 10
            }

            return {
                ...prev,
                betAmount: newBetAmount
            };
        });
    }, []);

    const resetGame = useCallback(() => {
        setGameState(INITIAL_STATE);
        setShowAllCells(false);
    }, []);

    useEffect(() => {
        const newBoard = initializeBoard();
        setGameState(prev => ({...prev, board: newBoard}));
    }, [initializeBoard]);

    return (
        <div className="mines-game">
            <GameHeader
                balance={gameState.balance}
                onMuteToggle={() => setIsMuted(!isMuted)}
                isMuted={isMuted}
            />

            <div className="right-panel">
                <CanvasBoard
                    board={gameState.board}
                    onRevealCell={revealCell}
                    gameStatus={gameState.gameStatus}
                    showAllCells={showAllCells}
                />
            </div>
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
    );
};

export default MinesGame;