"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { generateSudoku, checkSolution } from "../utils/sudoku"
import { Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")
const CELL_SIZE = Math.floor(width / 9) - 2
const CONTAINER_PADDING = 10

export default function SudokuGame() {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [board, setBoard] = useState<(number | null)[][]>([])
  const [solution, setSolution] = useState<number[][]>([])
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [notes, setNotes] = useState<Record<string, number[]>>({})
  const [isNoteMode, setIsNoteMode] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [initialBoard, setInitialBoard] = useState<(number | null)[][]>([])

  // Initialize the game
  useEffect(() => {
    newGame()
  }, [])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && !isComplete) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isComplete])

  const newGame = () => {
    const { puzzle, solution } = generateSudoku(difficulty)
    setBoard(puzzle)
    setSolution(solution)
    setInitialBoard(JSON.parse(JSON.stringify(puzzle)))
    setSelectedCell(null)
    setNotes({})
    setTimer(0)
    setIsRunning(true)
    setIsComplete(false)
  }

  const handleCellPress = (row: number, col: number) => {
    setSelectedCell([row, col])
  }

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isComplete) return

    const [row, col] = selectedCell

    // Don't allow changing initial numbers
    if (initialBoard[row][col] !== null) return

    if (isNoteMode) {
      const cellKey = `${row}-${col}`
      const currentNotes = notes[cellKey] || []

      setNotes({
        ...notes,
        [cellKey]: currentNotes.includes(num) ? currentNotes.filter((n) => n !== num) : [...currentNotes, num].sort(),
      })
    } else {
      const newBoard = [...board.map((row) => [...row])]
      newBoard[row][col] = num === board[row][col] ? null : num
      setBoard(newBoard)

      // Check if the puzzle is complete
      const isBoardFilled = newBoard.every((row) => row.every((cell) => cell !== null))
      if (isBoardFilled) {
        const isCorrect = checkSolution(newBoard, solution)
        if (isCorrect) {
          setIsComplete(true)
          setIsRunning(false)
        }
      }
    }
  }

  const handleClear = () => {
    if (!selectedCell) return
    const [row, col] = selectedCell

    // Don't allow clearing initial numbers
    if (initialBoard[row][col] !== null) return

    const newBoard = [...board.map((row) => [...row])]
    newBoard[row][col] = null
    setBoard(newBoard)

    // Clear notes for this cell
    const cellKey = `${row}-${col}`
    const newNotes = { ...notes }
    delete newNotes[cellKey]
    setNotes(newNotes)
  }

  const getHint = () => {
    if (!selectedCell) return

    const [row, col] = selectedCell

    // Don't provide hints for initial numbers
    if (initialBoard[row][col] !== null) return

    const newBoard = [...board.map((row) => [...row])]
    newBoard[row][col] = solution[row][col]
    setBoard(newBoard)

    // Clear notes for this cell
    const cellKey = `${row}-${col}`
    const newNotes = { ...notes }
    delete newNotes[cellKey]
    setNotes(newNotes)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const isCellSelected = (row: number, col: number) => {
    return selectedCell?.[0] === row && selectedCell?.[1] === col
  }

  const isCellInSameRowOrCol = (row: number, col: number) => {
    if (!selectedCell) return false
    const [selRow, selCol] = selectedCell
    return selRow === row || selCol === col
  }

  const isCellInSameBlock = (row: number, col: number) => {
    if (!selectedCell) return false
    const [selRow, selCol] = selectedCell
    const blockRow = Math.floor(selRow / 3)
    const blockCol = Math.floor(selCol / 3)
    const cellBlockRow = Math.floor(row / 3)
    const cellBlockCol = Math.floor(col / 3)
    return blockRow === cellBlockRow && blockCol === cellBlockCol
  }

  const isSameNumber = (row: number, col: number) => {
    if (!selectedCell) return false
    const [selRow, selCol] = selectedCell
    return board[row][col] !== null && board[selRow][selCol] !== null && board[row][col] === board[selRow][selCol]
  }

  const isInitialCell = (row: number, col: number) => {
    return initialBoard[row][col] !== null
  }

  const getCellBackgroundColor = (row: number, col: number) => {
    if (isCellSelected(row, col)) return "#bbdefb"
    if (isCellInSameRowOrCol(row, col) || isCellInSameBlock(row, col)) return "#e3f2fd"
    return "white"
  }

  const getCellTextColor = (row: number, col: number) => {
    if (isInitialCell(row, col)) return "#000000"
    if (isSameNumber(row, col)) return "#1976d2"
    return "#555555"
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Sudoku</Text>

        {/* Game controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlButton} onPress={() => setIsRunning(!isRunning)}>
              <Ionicons name={isRunning ? "pause" : "play"} size={18} color="#555" />
              <Text style={styles.controlText}>{formatTime(timer)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={newGame}>
              <Ionicons name="refresh" size={18} color="#555" />
              <Text style={styles.controlText}>New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, isNoteMode && styles.activeControlButton]}
              onPress={() => setIsNoteMode(!isNoteMode)}
            >
              <Ionicons name="pencil" size={18} color={isNoteMode ? "#fff" : "#555"} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={getHint}>
              <Ionicons name="bulb" size={18} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Difficulty selector */}
        <View style={styles.difficultyContainer}>
          <TouchableOpacity
            style={[styles.difficultyButton, difficulty === "easy" && styles.activeDifficultyButton]}
            onPress={() => {
              setDifficulty("easy")
              newGame()
            }}
          >
            <Text style={[styles.difficultyText, difficulty === "easy" && styles.activeDifficultyText]}>Easy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.difficultyButton, difficulty === "medium" && styles.activeDifficultyButton]}
            onPress={() => {
              setDifficulty("medium")
              newGame()
            }}
          >
            <Text style={[styles.difficultyText, difficulty === "medium" && styles.activeDifficultyText]}>Medium</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.difficultyButton, difficulty === "hard" && styles.activeDifficultyButton]}
            onPress={() => {
              setDifficulty("hard")
              newGame()
            }}
          >
            <Text style={[styles.difficultyText, difficulty === "hard" && styles.activeDifficultyText]}>Hard</Text>
          </TouchableOpacity>
        </View>

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
                      { backgroundColor: getCellBackgroundColor(rowIndex, colIndex) },
                      (colIndex + 1) % 3 === 0 && colIndex < 8 && styles.rightBorder,
                      (rowIndex + 1) % 3 === 0 && rowIndex < 8 && styles.bottomBorder,
                    ]}
                    onPress={() => handleCellPress(rowIndex, colIndex)}
                  >
                    {cell !== null ? (
                      <Text
                        style={[
                          styles.cellText,
                          isInitialCell(rowIndex, colIndex) && styles.initialCellText,
                          { color: getCellTextColor(rowIndex, colIndex) },
                        ]}
                      >
                        {cell}
                      </Text>
                    ) : (
                      <View style={styles.notesContainer}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                          const cellKey = `${rowIndex}-${colIndex}`
                          const hasNote = notes[cellKey]?.includes(num)
                          return (
                            <Text key={num} style={[styles.noteText, !hasNote && styles.hiddenNote]}>
                              {num}
                            </Text>
                          )
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
            <TouchableOpacity key={num} style={styles.numberButton} onPress={() => handleNumberInput(num)}>
              <Text style={styles.numberButtonText}>{num}</Text>
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
            <Text style={styles.completeText}>Congratulations! You solved the puzzle in {formatTime(timer)}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
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
  numberButtonText: {
    fontSize: 24,
    color: "#333",
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
})

