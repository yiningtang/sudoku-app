import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import SudokuGame from "./components/SudokuGame"

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SudokuGame />
    </SafeAreaProvider>
  )
}

