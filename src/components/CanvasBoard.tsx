import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { Cell } from "../types/game.ts";
import RedGem from "../assets/gems/mines-gem-red.png";
import BombIMG from "../assets/gems/mines-bomb.png";

interface CanvasBoardProps {
    board: Cell[];
    onRevealCell: (cellIndex: number) => void;
    gameStatus: string;
    showAllCells?: boolean;
}

const CanvasBoard: React.FC<CanvasBoardProps> = ({
                                                     board,
                                                     onRevealCell,
                                                     gameStatus,
                                                     showAllCells = false,
                                                 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredCell, setHoveredCell] = useState<number | null>(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const gemImageRef = useRef<HTMLImageElement | null>(null);
    const bombImageRef = useRef<HTMLImageElement | null>(null);

    const GRID_SIZE = 5;
    const CANVAS_SIZE = 800;
    const GRID_GAP = 8;

    const cellSize = (CANVAS_SIZE - (GRID_GAP * (GRID_SIZE - 1))) / GRID_SIZE;
    const totalGridWidth = GRID_SIZE * (cellSize + GRID_GAP) - GRID_GAP;
    const totalGridHeight = GRID_SIZE * (cellSize + GRID_GAP) - GRID_GAP;
    const gridStartX = (CANVAS_SIZE - totalGridWidth) / 2;
    const gridStartY = (CANVAS_SIZE - totalGridHeight) / 2;

    // Preload images on component mount
    useEffect(() => {
        let loadedCount = 0;
        const totalImages = 2;

        const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                setImagesLoaded(true);
            }
        };

        // Load gem image
        gemImageRef.current = new Image();
        gemImageRef.current.onload = checkAllLoaded;
        gemImageRef.current.onerror = checkAllLoaded;
        gemImageRef.current.src = RedGem;

        // Load bomb image
        bombImageRef.current = new Image();
        bombImageRef.current.onload = checkAllLoaded;
        bombImageRef.current.onerror = checkAllLoaded;
        bombImageRef.current.src = BombIMG;

        // Fallback in case images take too long
        const timeout = setTimeout(() => {
            setImagesLoaded(true);
        }, 3000);

        return () => clearTimeout(timeout);
    }, []);

    const getCellCoordinates = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        const adjustedX = x - gridStartX;
        const adjustedY = y - gridStartY;

        if (adjustedX < 0 || adjustedX >= totalGridWidth || adjustedY < 0 || adjustedY >= totalGridHeight) {
            return [-1, -1];
        }

        const col = Math.floor(adjustedX / (cellSize + GRID_GAP));
        const row = Math.floor(adjustedY / (cellSize + GRID_GAP));

        return [col, row];
    }, [gridStartX, gridStartY, totalGridWidth, totalGridHeight, cellSize]);

    const handleCanvasClick = useCallback((event: MouseEvent) => {
        if (gameStatus !== 'playing' || showAllCells) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const [col, row] = getCellCoordinates(event, canvas);

        if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return;

        const cellIndex = row * GRID_SIZE + col;
        const clickedCell = board[cellIndex];

        if (!clickedCell || clickedCell.isRevealed) return;

        onRevealCell(cellIndex);
    }, [gameStatus, getCellCoordinates, board, onRevealCell, showAllCells]);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (showAllCells) {
            canvas.style.cursor = 'default';
            setHoveredCell(null);
            return;
        }

        const [col, row] = getCellCoordinates(event, canvas);

        if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) {
            setHoveredCell(null);
            canvas.style.cursor = 'default';
            return;
        }

        const cellIndex = row * GRID_SIZE + col;
        const hoveredCellData = board[cellIndex];

        if (!hoveredCellData || hoveredCellData.isRevealed) {
            canvas.style.cursor = 'default';
            setHoveredCell(null);
        } else {
            canvas.style.cursor = 'pointer';
            setHoveredCell(cellIndex);
        }
    }, [getCellCoordinates, board, showAllCells]);

    const handleMouseOut = useCallback(() => {
        setHoveredCell(null);
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.cursor = 'default';
        }
    }, []);

    const drawCell = useCallback((ctx: CanvasRenderingContext2D, cell: Cell, x: number, y: number, isHovered: boolean = false, forceReveal: boolean = false) => {
        const cellX = gridStartX + x * (cellSize + GRID_GAP);
        const cellY = gridStartY + y * (cellSize + GRID_GAP);

        // Clear cell area
        ctx.clearRect(cellX, cellY, cellSize, cellSize);

        const shouldReveal = cell.isRevealed || forceReveal;

        if (shouldReveal) {
            if (cell.isBomb) {
                // Bomb cell
                const gradient = ctx.createLinearGradient(
                    cellX, cellY,
                    cellX + cellSize,
                    cellY + cellSize
                );
                gradient.addColorStop(0, '#0e0c1d');
                gradient.addColorStop(1, '#46060c');
                ctx.fillStyle = gradient;
                ctx.fillRect(cellX, cellY, cellSize, cellSize);

                // Draw bomb image if loaded
                if (imagesLoaded && bombImageRef.current) {
                    const bombSize = cellSize * 0.7;
                    const bombX = cellX + (cellSize - bombSize) / 2;
                    const bombY = cellY + (cellSize - bombSize) / 2;
                    ctx.drawImage(bombImageRef.current, bombX, bombY, bombSize, bombSize);
                } else {
                    // Fallback drawn bomb
                    ctx.fillStyle = '#2a0b0e';
                    ctx.beginPath();
                    ctx.arc(cellX + cellSize / 2, cellY + cellSize / 2, cellSize / 4, 0, 2 * Math.PI);
                    ctx.fill();
                }

            } else {
                // Gem cell
                const gradient = ctx.createLinearGradient(
                    cellX, cellY,
                    cellX + cellSize,
                    cellY + cellSize
                );
                gradient.addColorStop(0, '#292d40');
                gradient.addColorStop(0.7, '#25273b');
                gradient.addColorStop(1, '#1e2032');
                ctx.fillStyle = gradient;
                ctx.fillRect(cellX, cellY, cellSize, cellSize);

                // Draw gem image if loaded
                if (imagesLoaded && gemImageRef.current) {
                    const gemSize = cellSize * 0.7;
                    const gemX = cellX + (cellSize - gemSize) / 2;
                    const gemY = cellY + (cellSize - gemSize) / 2;
                    ctx.drawImage(gemImageRef.current, gemX, gemY, gemSize, gemSize);
                } else {
                    // Fallback drawn gem
                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(cellX + cellSize / 2, cellY + cellSize / 4);
                    ctx.lineTo(cellX + cellSize * 3/4, cellY + cellSize / 2);
                    ctx.lineTo(cellX + cellSize / 2, cellY + cellSize * 3/4);
                    ctx.lineTo(cellX + cellSize / 4, cellY + cellSize / 2);
                    ctx.closePath();
                    ctx.fill();
                }

                ctx.globalAlpha = 1.0;
            }
        } else {
            // Hidden cell
            const gradient = ctx.createLinearGradient(
                cellX, cellY,
                cellX + cellSize,
                cellY + cellSize
            );

            if (isHovered) {
                gradient.addColorStop(0, '#364258');
                gradient.addColorStop(0.5, '#2d3648');
                gradient.addColorStop(1, '#252b3d');
            } else {
                gradient.addColorStop(0, '#2d3648');
                gradient.addColorStop(0.5, '#252b3d');
                gradient.addColorStop(1, '#1a1f2e');
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);

            ctx.strokeStyle = '#0c0f1d';
            ctx.lineWidth = 3;
            ctx.strokeRect(cellX + 3, cellY + 3, cellSize - 6, cellSize - 6);

            ctx.strokeStyle = isHovered ? '#00ff88' : '#364258';
            ctx.lineWidth = isHovered ? 3 : 2;
            ctx.strokeRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);

            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 1;
            ctx.strokeRect(cellX + 2, cellY + 2, cellSize - 4, 1);

            ctx.fillStyle = isHovered ? '#ffffff' : '#00ff88';
            ctx.font = `bold ${cellSize * 0.3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
            ctx.shadowBlur = isHovered ? 15 : 10;
            ctx.fillText('?', cellX + cellSize / 2, cellY + cellSize / 2);
            ctx.shadowBlur = 0;
        }

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
    }, [cellSize, gridStartX, gridStartY, imagesLoaded]);

    const drawBoard = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#0c0f1d';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = '#1a1f2e';
        ctx.fillRect(gridStartX - 20, gridStartY - 20, totalGridWidth + 40, totalGridHeight + 40);

        board.forEach(cell => {
            const isHovered = hoveredCell === (cell.y * GRID_SIZE + cell.x);
            const forceReveal = showAllCells;
            drawCell(ctx, cell, cell.x, cell.y, isHovered, forceReveal);
        });

        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;

        for (let i = 0; i <= GRID_SIZE; i++) {
            const lineX = gridStartX + i * (cellSize + GRID_GAP) - GRID_GAP / 2;
            ctx.beginPath();
            ctx.moveTo(lineX, gridStartY - 10);
            ctx.lineTo(lineX, gridStartY + totalGridHeight + 10);
            ctx.stroke();

            const lineY = gridStartY + i * (cellSize + GRID_GAP) - GRID_GAP / 2;
            ctx.beginPath();
            ctx.moveTo(gridStartX - 10, lineY);
            ctx.lineTo(gridStartX + totalGridWidth + 10, lineY);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

    }, [board, drawCell, gridStartX, gridStartY, totalGridWidth, totalGridHeight, cellSize, hoveredCell, showAllCells]);

    // Event listener setup
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseout', handleMouseOut);
        canvas.addEventListener('click', handleCanvasClick);

        drawBoard();

        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseout', handleMouseOut);
            canvas.removeEventListener('click', handleCanvasClick);
        };
    }, [drawBoard, handleMouseMove, handleMouseOut, handleCanvasClick]);

    // Redraw when images load or board changes
    useEffect(() => {
        drawBoard();
    }, [drawBoard, board, hoveredCell, showAllCells, imagesLoaded]);

    return (
        <div className="canvas-board-container">
            <canvas
                ref={canvasRef}
                id="minesCanvas"
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="mines-canvas"
            />
        </div>
    );
};

export default CanvasBoard;