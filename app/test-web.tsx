import { View, Text, StyleSheet } from 'react-native';

export default function TestWeb() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ التطبيق يعمل على الويب!</Text>
      <Text style={styles.subtitle}>Web App is Working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 24,
    color: '#4ade80',
  },
});
