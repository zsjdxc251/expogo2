import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expo Go Demo</Text>
        <Text style={styles.subtitle}>expogo2</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.emoji}>🚀</Text>
        <Text style={styles.cardTitle}>欢迎使用 Expo!</Text>
        <Text style={styles.cardText}>
          这是一个可以在 Expo Go 和 Snack 中运行的项目
        </Text>
      </View>

      <View style={styles.counterSection}>
        <Text style={styles.counterLabel}>点击计数器</Text>
        <Text style={styles.counterValue}>{count}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonMinus]}
            onPress={() => setCount((c) => Math.max(0, c - 1))}
          >
            <Text style={styles.buttonText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPlus]}
            onPress={() => setCount((c) => c + 1)}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => setCount(0)}
        >
          <Text style={styles.resetText}>重置</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>编辑 App.js 开始开发 ✨</Text>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a202c',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  counterSection: {
    alignItems: 'center',
  },
  counterLabel: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 8,
  },
  counterValue: {
    fontSize: 56,
    fontWeight: '700',
    color: '#2b6cb0',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonMinus: {
    backgroundColor: '#fc8181',
  },
  buttonPlus: {
    backgroundColor: '#68d391',
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  resetText: {
    fontSize: 14,
    color: '#4a5568',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 13,
    color: '#a0aec0',
  },
});
