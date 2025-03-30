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
import { generateSudoku } from "../utils/sudoku";
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
  const [invalidCells, setInvalidCells] = useState<Set<string>>(new Set());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [opacityAnim] = useState(new Animated.Value(0));

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

  const newGame = async () => {
    setIsLoading(true);
    setIsRunning(false);
    setSelectedNumber(null);
    setInvalidCells(new Set());

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

  // Check if the current board state is valid
  const validateBoard = (newBoard: (number | null)[][]): Set<string> => {
    const invalidPositions = new Set<string>();

    // Check each cell
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = newBoard[row][col];
        if (value === null) continue;

        // Temporarily remove the value to check if it's valid
        newBoard[row][col] = null;

        // Check if placing this value here is valid
        if (!isValidSudokuPlacement(newBoard, row, col, value)) {
          invalidPositions.add(`${row}-${col}`);
        }

        // Put the value back
        newBoard[row][col] = value;
      }
    }

    return invalidPositions;
  };

  // Check if placing a number at a position is valid according to Sudoku rules
  const isValidSudokuPlacement = (
    board: (number | null)[][],
    row: number,
    col: number,
    num: number
  ): boolean => {
    // Check row
    for (let i = 0; i < 9; i++) {
      if (i !== col && board[row][i] === num) {
        return false;
      }
    }

    // Check column
    for (let i = 0; i < 9; i++) {
      if (i !== row && board[i][col] === num) {
        return false;
      }
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const r = boxRow + i;
        const c = boxCol + j;
        if (r !== row || c !== col) {
          if (board[r][c] === num) {
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleCellPress = (row: number, col: number) => {
    setSelectedCell([row, col]);

    // If the cell has a number, select that number
    const cellValue = board[row][col];
    if (cellValue !== null) {
      setSelectedNumber(cellValue);
    }
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
      const newBoard = [...board.map((row) => [...row])];

      // If the same number is already there, clear it
      if (newBoard[row][col] === num) {
        newBoard[row][col] = null;
        setBoard(newBoard);

        // Update selected number
        setSelectedNumber(null);

        // Revalidate the board
        const newInvalidCells = validateBoard(newBoard);
        setInvalidCells(newInvalidCells);
        return;
      }

      // Check if placing this number here is valid
      newBoard[row][col] = num;

      // Update the board
      setBoard(newBoard);

      // Update selected number
      setSelectedNumber(num);

      // Validate the board
      const newInvalidCells = validateBoard(newBoard);
      setInvalidCells(newInvalidCells);

      // Check if the puzzle is complete
      const isBoardFilled = newBoard.every((row) =>
        row.every((cell) => cell !== null)
      );
      if (isBoardFilled && newInvalidCells.size === 0) {
        setIsComplete(true);
        setIsRunning(false);
      }
    }
  };

  const handleClear = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;

    // Don't allow clearing initial numbers
    if (initialBoard[row][col] !== null) return;

    const newBoard = [...board.map((row) => [...row])];
    newBoard[row][col] = null;
    setBoard(newBoard);

    // Clear notes for this cell
    const cellKey = `${row}-${col}`;
    const newNotes = { ...notes };
    delete newNotes[cellKey];
    setNotes(newNotes);

    // Revalidate the board
    const newInvalidCells = validateBoard(newBoard);
    setInvalidCells(newInvalidCells);
  };

  const getHint = () => {
    if (!selectedCell) return;

    const [row, col] = selectedCell;

    // Don't provide hints for initial numbers
    if (initialBoard[row][col] !== null) return;

    const newBoard = [...board.map((row) => [...row])];
    newBoard[row][col] = solution[row][col];
    setBoard(newBoard);

    // Update selected number
    setSelectedNumber(solution[row][col]);

    // Clear notes for this cell
    const cellKey = `${row}-${col}`;
    const newNotes = { ...notes };
    delete newNotes[cellKey];
    setNotes(newNotes);

    // Revalidate the board
    const newInvalidCells = validateBoard(newBoard);
    setInvalidCells(newInvalidCells);
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

  const isCellInvalid = (row: number, col: number) => {
    return invalidCells.has(`${row}-${col}`);
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

  const getCellBackgroundColor = (row: number, col: number) => {
    if (isCellSelected(row, col)) return "#bbdefb";
    if (isCellInvalid(row, col)) return "#ffcdd2";
    if (isSelectedNumber(row, col)) return "#e3f2fd";
    if (isCellInSameRowOrCol(row, col) || isCellInSameBlock(row, col))
      return "#f5f5f5";
    return "white";
  };

  const getCellTextColor = (row: number, col: number) => {
    if (isCellInvalid(row, col)) return "#d32f2f";
    if (isInitialCell(row, col)) return "#000000";
    if (isSelectedNumber(row, col)) return "#1976d2";
    if (isSameNumber(row, col)) return "#1976d2";
    return "#555555";
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            >
              <Ionicons name="bulb" size={18} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

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
            {selectedNumber !== null && (
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

            {/* Error message - only shown when board is invalid */}
            {invalidCells.size > 0 && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#d32f2f" />
                <Text style={styles.errorText}>
                  Invalid board - please fix highlighted cells
                </Text>
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
                >
                  <Text
                    style={[
                      styles.numberButtonText,
                      selectedNumber === num && styles.selectedNumberButtonText,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Clear button */}
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>

            {/* Game complete message */}
            {isComplete && (
              <View style={styles.completeContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
                <Text style={styles.completeText}>
                  Congratulations! You solved the puzzle in {formatTime(timer)}
                </Text>
              </View>
            )}
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
                  <Text style={styles.successText}>
                    You've completed the puzzle!
                  </Text>

                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Time</Text>
                      <Text style={styles.statValue}>{formatTime(timer)}</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Difficulty</Text>
                      <Text style={styles.statValue}>
                        {getDifficultyText()}
                      </Text>
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
          </>
        )}
      </ScrollView>
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
    marginBottom: 8,
  },
  selectedNumberText: {
    fontSize: 14,
    color: "#1976d2",
    marginRight: 8,
  },
  clearSelectionButton: {
    padding: 2,
  },
  invalidCellsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  invalidCellsText: {
    fontSize: 14,
    color: "#d32f2f",
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#d32f2f",
    marginLeft: 8,
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
  completeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  completeText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#2e7d32",
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
