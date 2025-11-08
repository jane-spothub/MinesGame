import React from 'react';
import type {GameState} from "../types/game.ts";

interface GameControlsProps {
    gameState: GameState;
    onStart: () => void;
    onCashOut: () => void;
    onReset: () => void;
    onChangeLevel: (level: 'easy' | 'medium' | 'hard') => void;
    onChangeBet: (amount: number) => void;
    onAdjustBet: (increment: boolean) => void;
}

const GameControls: React.FC<GameControlsProps> = ({
                                                       gameState,
                                                       onStart,
                                                       onCashOut,
                                                       onReset,
                                                       onChangeLevel,
                                                       onChangeBet,
                                                       onAdjustBet
                                                   }) => {
    const betAmounts = [20, 50, 100, 500, 1000];

    return (
        <div className="game-controls">
            <div className="control-section">
                <div className="section-title">Bet Amount</div>
                <div className="main-bet-amounts">
                    <div className="bet-amount-selector">
                        {betAmounts.map(amount => (
                            <button
                                key={amount}
                                className={`bet-amount-btn ${gameState.betAmount === amount ? 'active' : ''}`}
                                onClick={() => onChangeBet(amount)}
                            >
                                {amount}
                            </button>
                        ))}
                    </div>
                    <div className="bet-adjuster">
                        <button
                            className="bet-adjust-btn"
                            onClick={() => onAdjustBet(false)}
                        >
                            -
                        </button>
                        <span className="current-bet">{gameState.betAmount}</span>
                        <button
                            className="bet-adjust-btn"
                            onClick={() => onAdjustBet(true)}
                        >
                            +
                        </button>
                    </div>
                </div>

            </div>

            <div className="control-section">
                <div className="section-title">Level</div>
                <div className="level-active">
                    <div className="level-selector">
                        {(gameState.gameStatus === 'idle' ? ['easy', 'medium', 'hard'] : [gameState.level]).map(level => (
                            <button
                                key={level}
                                className={`level-btn ${gameState.level === level ? 'active' : ''}`}
                                onClick={() => onChangeLevel(level as 'easy' | 'medium' | 'hard')}
                            >
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                        ))}
                    </div>
                    {gameState.gameStatus === 'playing' && (
                        <div className="multiplier-section">
                            <div className="multiplier-display">
                                <span className="multiplier-label">Multiplier</span>
                                <span className="multiplier-value">×{gameState.multiplier.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>



            <div className="action-buttons">
                {{
                    idle: (
                        <button
                            className="action-btn start-btn"
                            onClick={onStart}
                            disabled={gameState.balance < gameState.betAmount}
                        >
                            START GAME
                        </button>
                    ),
                    playing: (
                        <button
                            className="action-btn cashout-btn"
                            onClick={onCashOut}
                        >
                            CASH OUT Ksh{(gameState.betAmount * gameState.multiplier).toFixed(2)}
                        </button>
                    ),
                    win: (
                        <button
                            className="action-btn reset-btn"
                            onClick={onReset}
                        >
                            PLAY AGAIN
                        </button>
                    ),
                    lose: (
                        <button
                            className="action-btn reset-btn"
                            onClick={onReset}
                        >
                            PLAY AGAIN
                        </button>
                    )
                }[gameState.gameStatus]}
            </div>

            {gameState.gameStatus === 'lose' && (
                <div className="game-over-message">
                    Game Over! You hit a bomb.
                </div>
            )}

            {gameState.gameStatus === 'win' && (
                <div className="win-message">
                    Congratulations! You won ksh{gameState.totalWinnings.toFixed(2)}
                </div>
            )}
        </div>
    );
};

export default GameControls;