"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, Lightbulb, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateSudoku, checkSolution } from "@/lib/sudoku";

export default function SudokuGame() {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [board, setBoard] = useState<(number | null)[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [initialBoard, setInitialBoard] = useState<(number | null)[][]>([]);

  // Initialize the game
  useEffect(() => {
    newGame();
  }, []); // Removed unnecessary dependency: difficulty

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && !isComplete) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isComplete]);

  const newGame = () => {
    const { puzzle, solution } = generateSudoku(difficulty);
    setBoard(puzzle);
    setSolution(solution);
    setInitialBoard(JSON.parse(JSON.stringify(puzzle)));
    setSelectedCell(null);
    setNotes({});
    setTimer(0);
    setIsRunning(true);
    setIsComplete(false);
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isComplete) return;

    const [row, col] = selectedCell;

    // Don't allow changing initial numbers
    if (initialBoard[row][col] !== null) return;

    if (isNoteMode) {
      const cellKey = `${row}-${col}`;
      const currentNotes = notes[cellKey] || [];

      setNotes({
        ...notes,
        [cellKey]: currentNotes.includes(num)
          ? currentNotes.filter((n) => n !== num)
          : [...currentNotes, num].sort(),
      });
    } else {
      const newBoard = [...board];
      newBoard[row][col] = num === board[row][col] ? null : num;
      setBoard(newBoard);

      // Check if the puzzle is complete
      const isBoardFilled = newBoard.every((row) =>
        row.every((cell) => cell !== null)
      );
      if (isBoardFilled) {
        const isCorrect = checkSolution(newBoard, solution);
        if (isCorrect) {
          setIsComplete(true);
          setIsRunning(false);
        }
      }
    }
  };

  const handleClear = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;

    // Don't allow clearing initial numbers
    if (initialBoard[row][col] !== null) return;

    const newBoard = [...board];
    newBoard[row][col] = null;
    setBoard(newBoard);

    // Clear notes for this cell
    const cellKey = `${row}-${col}`;
    const newNotes = { ...notes };
    delete newNotes[cellKey];
    setNotes(newNotes);
  };

  const getHint = () => {
    if (!selectedCell) return;

    const [row, col] = selectedCell;

    // Don't provide hints for initial numbers
    if (initialBoard[row][col] !== null) return;

    const newBoard = [...board];
    newBoard[row][col] = solution[row][col];
    setBoard(newBoard);

    // Clear notes for this cell
    const cellKey = `${row}-${col}`;
    const newNotes = { ...notes };
    delete newNotes[cellKey];
    setNotes(newNotes);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const isCellSelected = (row: number, col: number) => {
    return selectedCell?.[0] === row && selectedCell?.[1] === col;
  };

  const isCellInSameRowOrCol = (row: number, col: number) => {
    if (!selectedCell) return false;
    const [selRow, selCol] = selectedCell;
    return selRow === row || selCol === col;
  };

  const isCellInSameBlock = (row: number, col: number) => {
    if (!selectedCell) return false;
    const [selRow, selCol] = selectedCell;
    const blockRow = Math.floor(selRow / 3);
    const blockCol = Math.floor(selCol / 3);
    const cellBlockRow = Math.floor(row / 3);
    const cellBlockCol = Math.floor(col / 3);
    return blockRow === cellBlockRow && blockCol === cellBlockCol;
  };

  const isSameNumber = (row: number, col: number) => {
    if (!selectedCell) return false;
    const [selRow, selCol] = selectedCell;
    return (
      board[row][col] !== null &&
      board[selRow][selCol] !== null &&
      board[row][col] === board[selRow][selCol]
    );
  };

  const isInitialCell = (row: number, col: number) => {
    return initialBoard[row][col] !== null;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Game controls */}
      <div className="flex justify-between w-full mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center"
          >
            <Clock className="h-4 w-4 mr-1" />
            {formatTime(timer)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={newGame}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={isNoteMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsNoteMode(!isNoteMode)}
            className="flex items-center"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={getHint}
            className="flex items-center"
          >
            <Lightbulb className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Difficulty selector */}
      <div className="flex space-x-2 mb-4">
        <Button
          variant={difficulty === "easy" ? "default" : "outline"}
          size="sm"
          onClick={() => setDifficulty("easy")}
        >
          Easy
        </Button>
        <Button
          variant={difficulty === "medium" ? "default" : "outline"}
          size="sm"
          onClick={() => setDifficulty("medium")}
        >
          Medium
        </Button>
        <Button
          variant={difficulty === "medium" ? "default" : "outline"}
          size="sm"
          onClick={() => setDifficulty("hard")}
        >
          Hard
        </Button>
      </div>

      {/* Sudoku board */}
      <div className="mb-4 border-2 border-gray-800 rounded-md overflow-hidden">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  "w-9 h-9 flex items-center justify-center border border-gray-300 select-none",
                  isCellSelected(rowIndex, colIndex) && "bg-blue-200",
                  !isCellSelected(rowIndex, colIndex) &&
                    isCellInSameRowOrCol(rowIndex, colIndex) &&
                    "bg-blue-50",
                  !isCellSelected(rowIndex, colIndex) &&
                    isCellInSameBlock(rowIndex, colIndex) &&
                    "bg-blue-50",
                  isSameNumber(rowIndex, colIndex) && "text-blue-600",
                  isInitialCell(rowIndex, colIndex) && "font-bold",
                  (colIndex + 1) % 3 === 0 &&
                    colIndex < 8 &&
                    "border-r-2 border-r-gray-800",
                  (rowIndex + 1) % 3 === 0 &&
                    rowIndex < 8 &&
                    "border-b-2 border-b-gray-800"
                )}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell !== null ? (
                  <span>{cell}</span>
                ) : (
                  <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
                    {notes[`${rowIndex}-${colIndex}`]?.map((note) => (
                      <span
                        key={note}
                        className="text-[8px] text-gray-500 flex items-center justify-center"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Number input pad */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            className="h-12 text-lg font-medium"
            onClick={() => handleNumberInput(num)}
          >
            {num}
          </Button>
        ))}
      </div>

      {/* Clear button */}
      <Button
        variant="outline"
        className="w-full max-w-xs"
        onClick={handleClear}
      >
        Clear
      </Button>

      {/* Game complete message */}
      {isComplete && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md flex items-center">
          <Check className="h-5 w-5 mr-2" />
          Congratulations! You solved the puzzle in {formatTime(timer)}
        </div>
      )}
    </div>
  );
}
