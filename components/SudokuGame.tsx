"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Animated,
} from "react-native";
import { generateSudoku, checkSolution } from "../utils/sudoku";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const CELL_SIZE = Math.floor(width / 9) - 2;
const CONTAINER_PADDING = 10;

export default function SudokuGame() {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [board, setBoard] = useState<(number | null)[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [initialBoard, setInitialBoard] = useState<(number | null)[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [incorrectCells, setIncorrectCells] = useState<Set<string>>(new Set());
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessageTimer, setErrorMessageTimer] =
    useState<NodeJS.Timeout | null>(null);

  // Initialize the game
  useEffect(() => {
    newGame();
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isRunning && !isComplete) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isComplete]);

  // Show success modal when game is complete
  useEffect(() => {
    if (isComplete) {
      setShowSuccessModal(true);

      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setShowSuccessModal(false);
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [isComplete]);

  // Clean up error message timer
  useEffect(() => {
    return () => {
      if (errorMessageTimer) {
        clearTimeout(errorMessageTimer);
      }
    };
  }, [errorMessageTimer]);

  const newGame = async () => {
    setIsLoading(true);
    setIsRunning(false);
    setSelectedNumber(null);
    setShowSuccessModal(false);
    setIncorrectCells(new Set());
    setShowErrorMessage(false);

    if (errorMessageTimer) {
      clearTimeout(errorMessageTimer);
      setErrorMessageTimer(null);
    }

    // Use setTimeout to allow the loading indicator to render
    setTimeout(() => {
      try {
        const { puzzle, solution } = generateSudoku(difficulty);
        setBoard(puzzle);
        setSolution(solution);
        setInitialBoard(JSON.parse(JSON.stringify(puzzle)));
        setSelectedCell(null);
        setNotes({});
        setTimer(0);
        setIsComplete(false);
        setIsRunning(true);
      } catch (error) {
        console.error("Error generating puzzle:", error);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  const handleCellPress = (row: number, col: number) => {
    if (isComplete) return;

    setSelectedCell([row, col]);

    // If the cell has a number, select that number
    const cellValue = board[row][col];
    if (cellValue !== null) {
      setSelectedNumber(cellValue);
    }
  };

  const isNumberCorrect = (row: number, col: number, num: number): boolean => {
    return solution[row][col] === num;
  };

  const showError = () => {
    setShowErrorMessage(true);

    // Clear any existing timer
    if (errorMessageTimer) {
      clearTimeout(errorMessageTimer);
    }

    // Set a new timer to hide the error message after 3 seconds
    const timer = setTimeout(() => {
      setShowErrorMessage(false);
      setErrorMessageTimer(null);
    }, 3000);

    setErrorMessageTimer(timer);
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
      // Check if the number is the same as already in the cell
      if (board[row][col] === num) {
        // If it's the same, just clear the cell
        const newBoard = [...board.map((row) => [...row])];
        newBoard[row][col] = null;
        setBoard(newBoard);

        // Remove from incorrect cells if it was there
        if (incorrectCells.has(`${row}-${col}`)) {
          const newIncorrectCells = new Set(incorrectCells);
          newIncorrectCells.delete(`${row}-${col}`);
          setIncorrectCells(newIncorrectCells);
        }

        // Update selected number
        setSelectedNumber(null);
        return;
      }

      // Check if the number is correct according to the solution
      const isCorrect = isNumberCorrect(row, col, num);

      const newBoard = [...board.map((row) => [...row])];
      newBoard[row][col] = num;
      setBoard(newBoard);

      // Update selected number
      setSelectedNumber(num);

      if (!isCorrect) {
        // Add to incorrect cells using functional update to avoid render loops
        setIncorrectCells((prevIncorrectCells) => {
          const newIncorrectCells = new Set(prevIncorrectCells);
          newIncorrectCells.add(`${row}-${col}`);
          return newIncorrectCells;
        });

        // Show error message
        showError();
      } else {
        // Remove from incorrect cells if it was there
        setIncorrectCells((prevIncorrectCells) => {
          if (prevIncorrectCells.has(`${row}-${col}`)) {
            const newIncorrectCells = new Set(prevIncorrectCells);
            newIncorrectCells.delete(`${row}-${col}`);
            return newIncorrectCells;
          }
          return prevIncorrectCells;
        });

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
    }
  };

  const handleClear = () => {
    if (!selectedCell || isComplete) return;
    const [row, col] = selectedCell;

    // Don't allow clearing initial numbers
    if (initialBoard[row][col] !== null) return;

    const newBoard = [...board.map((row) => [...row])];
    newBoard[row][col] = null;
    setBoard(newBoard);

    // Remove from incorrect cells if it was there
    setIncorrectCells((prevIncorrectCells) => {
      if (prevIncorrectCells.has(`${row}-${col}`)) {
        const newIncorrectCells = new Set(prevIncorrectCells);
        newIncorrectCells.delete(`${row}-${col}`);
        return newIncorrectCells;
      }
      return prevIncorrectCells;
    });

    // Clear notes for this cell
    const cellKey = `${row}-${col}`;
    const newNotes = { ...notes };
    delete newNotes[cellKey];
    setNotes(newNotes);
  };

  const getHint = () => {
    if (!selectedCell || isComplete) return;

    const [row, col] = selectedCell;

    // Don't provide hints for initial numbers
    if (initialBoard[row][col] !== null) return;

    const newBoard = [...board.map((row) => [...row])];
    newBoard[row][col] = solution[row][col];
    setBoard(newBoard);

    // Remove from incorrect cells if it was there
    setIncorrectCells((prevIncorrectCells) => {
      if (prevIncorrectCells.has(`${row}-${col}`)) {
        const newIncorrectCells = new Set(prevIncorrectCells);
        newIncorrectCells.delete(`${row}-${col}`);
        return newIncorrectCells;
      }
      return prevIncorrectCells;
    });

    // Update selected number
    setSelectedNumber(solution[row][col]);

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

  const isSelectedNumber = (row: number, col: number) => {
    return selectedNumber !== null && board[row][col] === selectedNumber;
  };

  const isInitialCell = (row: number, col: number) => {
    return initialBoard[row][col] !== null;
  };

  const isIncorrectCell = (row: number, col: number) => {
    const key = `${row}-${col}`;
    return incorrectCells.has(key);
  };

  const getCellBackgroundColor = (row: number, col: number) => {
    if (isIncorrectCell(row, col)) return "#ffcdd2"; // Light red for incorrect cells
    if (isSelectedNumber(row, col)) return "#e3f2fd";
    if (isCellSelected(row, col)) return "#bbdefb";
    if (isCellInSameRowOrCol(row, col) || isCellInSameBlock(row, col))
      return "#f5f5f5";
    return "white";
  };

  const getCellTextColor = (row: number, col: number) => {
    if (isIncorrectCell(row, col)) return "#d32f2f"; // Dark red for incorrect numbers
    if (isInitialCell(row, col)) return "#000000";
    if (isSelectedNumber(row, col)) return "#1976d2";
    if (isSameNumber(row, col)) return "#1976d2";
    return "#555555";
  };

  const getDifficultyText = () => {
    switch (difficulty) {
      case "easy":
        return "Easy";
      case "medium":
        return "Medium";
      case "hard":
        return "Hard";
      default:
        return "Medium";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Sudoku</Text>

        {/* Game controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setIsRunning(!isRunning)}
              disabled={isLoading || isComplete}
            >
              <Ionicons
                name={isRunning ? "pause" : "play"}
                size={18}
                color="#555"
              />
              <Text style={styles.controlText}>{formatTime(timer)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={newGame}
              disabled={isLoading}
            >
              <Ionicons name="refresh" size={18} color="#555" />
              <Text style={styles.controlText}>New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isNoteMode && styles.activeControlButton,
              ]}
              onPress={() => setIsNoteMode(!isNoteMode)}
              disabled={isLoading || isComplete}
            >
              <Ionicons
                name="pencil"
                size={18}
                color={isNoteMode ? "#fff" : "#555"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={getHint}
              disabled={isLoading || isComplete}
            >
              <Ionicons name="bulb" size={18} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error message */}
        {showErrorMessage && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#d32f2f" />
            <Text style={styles.errorText}>Incorrect number! Try again.</Text>
          </View>
        )}

        {/* Loading indicator */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196f3" />
            <Text style={styles.loadingText}>Generating puzzle...</Text>
          </View>
        ) : (
          <>
            {/* Difficulty selector */}
            <View style={styles.difficultyContainer}>
              <TouchableOpacity
                style={[
                  styles.difficultyButton,
                  difficulty === "easy" && styles.activeDifficultyButton,
                ]}
                onPress={() => {
                  setDifficulty("easy");
                  newGame();
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    difficulty === "easy" && styles.activeDifficultyText,
                  ]}
                >
                  Easy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.difficultyButton,
                  difficulty === "medium" && styles.activeDifficultyButton,
                ]}
                onPress={() => {
                  setDifficulty("medium");
                  newGame();
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    difficulty === "medium" && styles.activeDifficultyText,
                  ]}
                >
                  Medium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.difficultyButton,
                  difficulty === "hard" && styles.activeDifficultyButton,
                ]}
                onPress={() => {
                  setDifficulty("hard");
                  newGame();
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    difficulty === "hard" && styles.activeDifficultyText,
                  ]}
                >
                  Hard
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selected number indicator */}
            {selectedNumber !== null && !isComplete && (
              <View style={styles.selectedNumberContainer}>
                <Text style={styles.selectedNumberText}>
                  Selected: {selectedNumber}
                </Text>
                <TouchableOpacity
                  style={styles.clearSelectionButton}
                  onPress={() => setSelectedNumber(null)}
                >
                  <Ionicons name="close-circle" size={18} color="#555" />
                </TouchableOpacity>
              </View>
            )}

            {/* Sudoku board */}
            {board.length > 0 && (
              <View style={styles.boardContainer}>
                {board.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.row}>
                    {row.map((cell, colIndex) => (
                      <TouchableOpacity
                        key={`${rowIndex}-${colIndex}`}
                        style={[
                          styles.cell,
                          {
                            backgroundColor: getCellBackgroundColor(
                              rowIndex,
                              colIndex
                            ),
                          },
                          (colIndex + 1) % 3 === 0 &&
                            colIndex < 8 &&
                            styles.rightBorder,
                          (rowIndex + 1) % 3 === 0 &&
                            rowIndex < 8 &&
                            styles.bottomBorder,
                        ]}
                        onPress={() => handleCellPress(rowIndex, colIndex)}
                        disabled={isComplete}
                      >
                        {cell !== null ? (
                          <Text
                            style={[
                              styles.cellText,
                              isInitialCell(rowIndex, colIndex) &&
                                styles.initialCellText,
                              { color: getCellTextColor(rowIndex, colIndex) },
                            ]}
                          >
                            {cell}
                          </Text>
                        ) : (
                          <View style={styles.notesContainer}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                              const cellKey = `${rowIndex}-${colIndex}`;
                              const hasNote = notes[cellKey]?.includes(num);
                              return (
                                <Text
                                  key={num}
                                  style={[
                                    styles.noteText,
                                    !hasNote && styles.hiddenNote,
                                    selectedNumber === num &&
                                      hasNote &&
                                      styles.highlightedNoteText,
                                  ]}
                                >
                                  {num}
                                </Text>
                              );
                            })}
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Number input pad */}
            {!isComplete && (
              <View style={styles.numberPad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.numberButton,
                      selectedNumber === num && styles.selectedNumberButton,
                    ]}
                    onPress={() => {
                      handleNumberInput(num);
                      // Also select this number for highlighting
                      setSelectedNumber(selectedNumber === num ? null : num);
                    }}
                    disabled={isComplete}
                  >
                    <Text
                      style={[
                        styles.numberButtonText,
                        selectedNumber === num &&
                          styles.selectedNumberButtonText,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Clear button */}
            {!isComplete && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                disabled={isComplete}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.successModal,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <View style={styles.confettiContainer}>
              <Ionicons
                name="trophy"
                size={80}
                color="#FFD700"
                style={styles.trophyIcon}
              />
            </View>

            <Text style={styles.congratsText}>Congratulations!</Text>
            <Text style={styles.successText}>You've completed the puzzle!</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>{formatTime(timer)}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Difficulty</Text>
                <Text style={styles.statValue}>{getDifficultyText()}</Text>
              </View>
            </View>

            <View style={styles.successButtonsContainer}>
              <TouchableOpacity
                style={[styles.successButton, styles.viewBoardButton]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.viewBoardButtonText}>View Board</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.successButton, styles.newGameButton]}
                onPress={newGame}
              >
                <Text style={styles.newGameButtonText}>New Game</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    padding: CONTAINER_PADDING,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 16,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  controlsRow: {
    flexDirection: "row",
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeControlButton: {
    backgroundColor: "#2196f3",
  },
  controlText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#555",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#d32f2f",
  },
  difficultyContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  difficultyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "white",
  },
  activeDifficultyButton: {
    backgroundColor: "#2196f3",
    borderColor: "#2196f3",
  },
  difficultyText: {
    fontSize: 14,
    color: "#555",
  },
  activeDifficultyText: {
    color: "white",
  },
  selectedNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  selectedNumberText: {
    fontSize: 14,
    color: "#1976d2",
    marginRight: 8,
  },
  clearSelectionButton: {
    padding: 2,
  },
  boardContainer: {
    width: width - 2 * CONTAINER_PADDING,
    height: width - 2 * CONTAINER_PADDING,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    height: CELL_SIZE,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  rightBorder: {
    borderRightWidth: 2,
    borderRightColor: "#333",
  },
  bottomBorder: {
    borderBottomWidth: 2,
    borderBottomColor: "#333",
  },
  cellText: {
    fontSize: 18,
    color: "#555",
  },
  initialCellText: {
    fontWeight: "bold",
    color: "#000",
  },
  incorrectCellText: {
    color: "#d32f2f",
  },
  notesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    height: "100%",
    padding: 2,
  },
  noteText: {
    width: "33%",
    height: "33%",
    fontSize: 8,
    textAlign: "center",
    color: "#888",
  },
  highlightedNoteText: {
    color: "#1976d2",
    fontWeight: "bold",
  },
  hiddenNote: {
    opacity: 0,
  },
  numberPad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: 300,
    marginBottom: 16,
  },
  numberButton: {
    width: "30%",
    aspectRatio: 1,
    margin: "1.5%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedNumberButton: {
    backgroundColor: "#e3f2fd",
    borderColor: "#1976d2",
  },
  numberButtonText: {
    fontSize: 24,
    color: "#333",
  },
  selectedNumberButtonText: {
    color: "#1976d2",
    fontWeight: "bold",
  },
  clearButton: {
    width: "100%",
    maxWidth: 300,
    paddingVertical: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    marginBottom: 16,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#555",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    height: 300,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModal: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confettiContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  trophyIcon: {
    marginBottom: 8,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2196f3",
    marginBottom: 8,
    textAlign: "center",
  },
  successText: {
    fontSize: 18,
    color: "#555",
    marginBottom: 24,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  successButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  successButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  viewBoardButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  viewBoardButtonText: {
    color: "#555",
    fontWeight: "600",
  },
  newGameButton: {
    backgroundColor: "#2196f3",
  },
  newGameButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
