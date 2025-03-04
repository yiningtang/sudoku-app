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

// Create a puzzle by removing numbers from a solved board
function createPuzzle(solvedBoard: number[][], difficulty: "easy" | "medium" | "hard"): SudokuBoard {
  // Clone the solved board
  const puzzle: SudokuBoard = JSON.parse(JSON.stringify(solvedBoard))

  // Determine how many cells to remove based on difficulty
  let cellsToRemove: number
  switch (difficulty) {
    case "easy":
      cellsToRemove = 40 // 41 clues remaining
      break
    case "medium":
      cellsToRemove = 50 // 31 clues remaining
      break
    case "hard":
      cellsToRemove = 60 // 21 clues remaining
      break
    default:
      cellsToRemove = 50
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

  // Remove numbers one by one, ensuring the puzzle still has a unique solution
  for (let i = 0; i < cellsToRemove; i++) {
    const [row, col] = positions[i]
    puzzle[row][col] = null
  }

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

