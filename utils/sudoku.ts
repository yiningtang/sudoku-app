type SudokuBoard = (number | null)[][]
type SudokuSolution = number[][]

// Generate a solved Sudoku board
function generateSolvedBoard(): number[][] {
  // Start with an empty board
  const board: number[][] = Array(9)
    .fill(0)
    .map(() => Array(9).fill(0))

  // Fill the board using backtracking
  solveBoardRandomly(board)

  return board
}

// Solve a board with random number selection for generation
function solveBoardRandomly(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        // Create a shuffled array of numbers 1-9
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)

        for (const num of nums) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num

            if (solveBoardRandomly(board)) {
              return true
            }

            board[row][col] = 0
          }
        }

        return false
      }
    }
  }

  return true
}

// Check if a number can be placed at a position
function isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) {
      return false
    }
  }

  // Check column
  for (let i = 0; i < 9; i++) {
    if (board[i][col] === num) {
      return false
    }
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxRow + i][boxCol + j] === num) {
        return false
      }
    }
  }

  return true
}

// Count the number of solutions a puzzle has
function countSolutions(board: number[][]): number {
  // Make a copy of the board to avoid modifying the original
  const boardCopy = board.map((row) => [...row])
  let count = 0

  // Find an empty cell
  const emptyCell = findEmptyCell(boardCopy)
  if (!emptyCell) {
    // No empty cells means we have a solution
    return 1
  }

  const [row, col] = emptyCell

  // Try each number 1-9
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(boardCopy, row, col, num)) {
      boardCopy[row][col] = num

      // Recursively count solutions
      count += countSolutions(boardCopy)

      // If we've found more than one solution, we can stop
      if (count > 1) {
        return count
      }

      // Backtrack
      boardCopy[row][col] = 0
    }
  }

  return count
}

// Find an empty cell in the board
function findEmptyCell(board: number[][]): [number, number] | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        return [row, col]
      }
    }
  }
  return null
}

// Convert null values to 0 for solving algorithms
function convertBoardForSolving(board: SudokuBoard): number[][] {
  return board.map((row) => row.map((cell) => (cell === null ? 0 : cell)))
}

// Create a puzzle by removing numbers from a solved board
function createPuzzle(solvedBoard: number[][], difficulty: "easy" | "medium" | "hard"): SudokuBoard {
  // Clone the solved board
  const puzzle: SudokuBoard = JSON.parse(JSON.stringify(solvedBoard))

  // Determine target number of clues based on difficulty
  let targetClues: number
  switch (difficulty) {
    case "easy":
      targetClues = 41 // 41 clues remaining (40 removed)
      break
    case "medium":
      targetClues = 31 // 31 clues remaining (50 removed)
      break
    case "hard":
      targetClues = 26 // 26 clues remaining (55 removed) - adjusted to ensure uniqueness
      break
    default:
      targetClues = 31
  }

  // Create a list of all positions
  const positions: [number, number][] = []
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push([row, col])
    }
  }

  // Shuffle the positions
  positions.sort(() => Math.random() - 0.5)

  // Keep track of cells we've tried to remove
  const triedPositions = new Set<string>()

  // Remove numbers one by one, ensuring the puzzle still has a unique solution
  let currentClues = 81 // Start with a full board
  let consecutiveFailures = 0
  const maxConsecutiveFailures = 10 // Stop after 10 consecutive failures to remove cells

  // Continue until we reach the target number of clues or have tried all positions
  // or have too many consecutive failures
  while (currentClues > targetClues && triedPositions.size < 81 && consecutiveFailures < maxConsecutiveFailures) {
    // Find a position we haven't tried yet
    let position: [number, number] | undefined
    for (const pos of positions) {
      const [row, col] = pos
      const key = `${row},${col}`
      if (!triedPositions.has(key) && puzzle[row][col] !== null) {
        position = pos
        triedPositions.add(key)
        break
      }
    }

    if (!position) break // No more positions to try

    const [row, col] = position
    const valueBackup = puzzle[row][col]
    puzzle[row][col] = null

    // Convert puzzle to number[][] for solution counting
    const boardForSolving = convertBoardForSolving(puzzle)

    // Check if the puzzle still has a unique solution
    const solutionCount = countSolutions(boardForSolving)

    if (solutionCount === 1) {
      // This removal preserves uniqueness
      currentClues--
      consecutiveFailures = 0 // Reset failure counter on success
    } else {
      // This removal creates multiple solutions, put the value back
      puzzle[row][col] = valueBackup
      consecutiveFailures++
    }
  }

  // If we couldn't reach the target due to uniqueness constraints,
  // that's okay - we'll return the puzzle with as many cells removed
  // as possible while maintaining a unique solution

  return puzzle
}

// Generate a Sudoku puzzle and its solution
export function generateSudoku(difficulty: "easy" | "medium" | "hard" = "medium") {
  const solution = generateSolvedBoard()
  const puzzle = createPuzzle(solution, difficulty)

  return { puzzle, solution }
}

// Check if a solution is correct
export function checkSolution(board: SudokuBoard, solution: SudokuSolution): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== solution[row][col]) {
        return false
      }
    }
  }

  return true
}

// Solve a Sudoku puzzle
export function solveSudoku(board: SudokuBoard): SudokuSolution | null {
  // Convert null to 0 for solving
  const solverBoard: number[][] = board.map((row) => row.map((cell) => (cell === null ? 0 : cell)))

  if (solveBoard(solverBoard)) {
    return solverBoard
  }

  return null
}

// Solve a board using backtracking
function solveBoard(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num

            if (solveBoard(board)) {
              return true
            }

            board[row][col] = 0
          }
        }

        return false
      }
    }
  }

  return true
}

