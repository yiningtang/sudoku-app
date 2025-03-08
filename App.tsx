import React from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import SudokuGame from "./components/SudokuGame";

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <SudokuGame />
    </View>
  );
}
