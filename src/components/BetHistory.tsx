// src/components/BetHistory.tsx
import { TrendingUp, TrendingDown } from 'lucide-react';
import type {FC} from "react";

export const BetHistory: FC = () => {
    // Mock data - replace with actual bet history from your state
    const betHistory = [
        { id: 1, amount: 10, multiplier: 2.5, result: 'win', timestamp: '2024-01-15 14:30' },
        { id: 2, amount: 20, multiplier: 0, result: 'loss', timestamp: '2024-01-15 14:25' },
        { id: 3, amount: 15, multiplier: 1.8, result: 'win', timestamp: '2024-01-15 14:20' },
        { id: 4, amount: 10, multiplier: 3.2, result: 'win', timestamp: '2024-01-15 14:15' },
        { id: 5, amount: 10, multiplier: 0, result: 'loss', timestamp: '2024-01-15 14:25' },
        { id: 6, amount: 50, multiplier: 5.4, result: 'win', timestamp: '2024-01-15 14:15' },
    ];

    return (
        <div className="bet-history">
            <h3 className="content-title">Bet History</h3>

            {betHistory.length === 0 ? (
                <div className="empty-state">
                    <p>No bet history yet</p>
                    <p className="empty-subtitle">Your betting history will appear here</p>
                </div>
            ) : (
                <div className="history-list">
                    {betHistory.map((bet) => (
                        <div key={bet.id} className={`history-item ${bet.result}`}>
                            <div className="history-icon">
                                {bet.result === 'win' ? (
                                    <TrendingUp size={16} />
                                ) : (
                                    <TrendingDown size={16} />
                                )}
                            </div>
                            <div className="history-details">
                                <div className="bet-amount">ksh{bet.amount}</div>
                                <div className="bet-time">{bet.timestamp}</div>
                            </div>
                            <div className="history-result">
                                {bet.result === 'win' ? (
                                    <span className="win-amount">+ksh{(bet.amount * bet.multiplier).toFixed(2)}</span>
                                ) : (
                                    <span className="loss-amount">-ksh{bet.amount}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};