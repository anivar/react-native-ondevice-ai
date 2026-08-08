import {
  analyzeText,
  chat,
  type DeviceCapabilities,
  enablePrivateMode,
  getDeviceCapabilities,
  smartReplies,
} from '@anivar/mobile-ai-toolkit';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);

  useEffect(() => {
    enablePrivateMode(false);
    getDeviceCapabilities()
      .then(setCapabilities)
      .catch((err: Error) => Alert.alert('Capabilities error', err.message));
  }, []);

  const runSentiment = async () => {
    if (!input.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }
    setLoading(true);
    try {
      const analysis = await analyzeText(input);
      const sentimentLine =
        typeof analysis.sentiment === 'number'
          ? `Sentiment score: ${analysis.sentiment.toFixed(2)}`
          : 'Sentiment: not provided by device';
      setResult(
        [
          sentimentLine,
          `Language: ${analysis.language || 'unknown'}`,
          analysis.entities && analysis.entities.length > 0
            ? `Entities: ${analysis.entities.map((e) => e.text).join(', ')}`
            : null,
        ]
          .filter(Boolean)
          .join('\n')
      );
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
    setLoading(false);
  };

  const runSmartReply = async () => {
    if (!input.trim()) {
      Alert.alert('Error', 'Please enter a message to reply to');
      return;
    }
    setLoading(true);
    try {
      const replies = await smartReplies([
        { text: input, fromUser: true, timestampMs: Date.now() },
      ]);
      setResult(
        replies.length === 0
          ? 'No smart replies returned.'
          : `Smart Replies:\n${replies.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
      );
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
    setLoading(false);
  };

  const runChat = async () => {
    if (!input.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }
    setLoading(true);
    try {
      const response = await chat([{ role: 'user', content: input }]);
      setResult(response);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
    setLoading(false);
  };

  const renderCapabilities = () => {
    if (!capabilities) return null;
    const onDevice =
      capabilities.hasAppleIntelligence || capabilities.hasGeminiNano || capabilities.hasMLKitGenAI;
    return (
      <View style={styles.capsBox}>
        <Text style={styles.capsTitle}>Device capabilities</Text>
        <Text style={styles.capsLine}>
          {capabilities.platform} {capabilities.osVersion}
          {capabilities.hasNeuralEngine ? ' - neural engine' : ''}
        </Text>
        <Text style={styles.capsLine}>On-device GenAI: {onDevice ? 'yes' : 'no'}</Text>
        <Text style={styles.capsLine}>
          Chat: {capabilities.availability.chat.state}
          {capabilities.availability.chat.reason
            ? ` (${capabilities.availability.chat.reason})`
            : ''}
        </Text>
        <Text style={styles.capsLine}>
          Smart replies: {capabilities.availability.smartReplies.state}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>Mobile AI Toolkit Demo</Text>
          <Text style={styles.subtitle}>On-device AI - Zero Cloud Costs</Text>
        </View>

        {renderCapabilities()}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Enter text to analyze..."
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={runSentiment}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Analyze Sentiment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={runSmartReply}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Smart Reply</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={runChat}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        {result !== '' && !loading && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Result:</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#007AFF', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  capsBox: {
    margin: 20,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  capsTitle: { fontWeight: '600', marginBottom: 4 },
  capsLine: { fontSize: 12, color: '#666' },
  inputContainer: { padding: 20 },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: { paddingHorizontal: 20 },
  button: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  primaryButton: { backgroundColor: '#007AFF' },
  secondaryButton: { backgroundColor: '#5856D6' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  loadingContainer: { padding: 20, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  resultContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  resultTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  resultText: { fontSize: 14, color: '#666', lineHeight: 22 },
});
