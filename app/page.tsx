import SudokuGame from "@/components/SudokuGame";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-50">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4">Sudoku</h1>
        <SudokuGame />
      </div>
    </main>
  );
}
