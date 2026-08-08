/**
 * What this example is for.
 *
 * Not "look, AI in a text box" — every wrapper can show that on the one phone
 * the author owns. The interesting question for this package is what happens
 * on *your* device, which is very likely not an AICore Android or an
 * Apple-Intelligence iPhone. So this app leads with availability: it shows what
 * this device can do, what it cannot, why, and whether that is permanent.
 *
 * Then it summarises an article, reporting which route produced the result and
 * whether it was degraded — so a fallback is never mistaken for a model.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type CallExplanation,
  type DeviceCapabilities,
  explainCall,
  getDeviceCapabilities,
  isAIError,
  summarize,
  type SummarizeResult,
} from '@anivar/mobile-ai-toolkit';

const ARTICLE = [
  'The city council approved the new transit plan on Tuesday evening.',
  'The plan adds twelve bus routes and extends two rail lines into the eastern suburbs.',
  'Council members said the transit plan would cut average commute times across the city.',
  'Funding comes from a bond measure voters approved last year.',
  'Construction is expected to begin in the spring.',
].join(' ');

const STATE_COLOR: Record<string, string> = {
  available: '#1a7f37',
  downloadable: '#9a6700',
  downloading: '#9a6700',
  unavailable: '#82071e',
};

export default function App() {
  const [caps, setCaps] = useState<DeviceCapabilities | null>(null);
  const [plans, setPlans] = useState<CallExplanation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SummarizeResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setCaps(await getDeviceCapabilities());
        setPlans(await explainCall());
      } catch (e) {
        // The likely cause on a first run is Expo Go, where no native module
        // exists. That rejects rather than crashing the bundle, which is the
        // whole point of the nullable registry lookup.
        setError(isAIError(e) ? `${e.code}: ${e.message}` : String(e));
      }
    })();
  }, []);

  const runSummarize = useCallback(async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await summarize(ARTICLE));
    } catch (e) {
      setError(isAIError(e) ? `${e.code} (${e.platformCode}): ${e.message}` : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>mobile-ai-toolkit</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {caps && (
          <Text style={styles.device}>
            {caps.platform} {caps.osVersion}
            {caps.hasNeuralEngine ? ' · neural engine' : ''}
            {caps.hasGeminiNano ? ' · Gemini Nano' : ''}
            {caps.hasAppleIntelligence ? ' · Apple Intelligence' : ''}
          </Text>
        )}

        <Text style={styles.h2}>What this device can do</Text>
        <Text style={styles.note}>
          Straight from ML Kit's checkFeatureStatus() and Apple's
          SystemLanguageModel.availability — not a guess from which classes were
          compiled in.
        </Text>

        {plans.map((plan) => (
          <View key={plan.feature} style={styles.row}>
            <Text style={styles.feature}>{plan.feature}</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.state, { color: STATE_COLOR[plan.availability.state] }]}>
                {plan.availability.state}
              </Text>
              {plan.availability.reason && (
                <Text style={styles.reason}>{plan.availability.reason}</Text>
              )}
              {!plan.mayChangeLater && plan.availability.state === 'unavailable' && (
                <Text style={styles.permanent}>permanent on this device</Text>
              )}
            </View>
          </View>
        ))}

        <Text style={styles.h2}>Summarize</Text>
        <Text style={styles.note}>
          If this device has no generative model, the call falls back to a
          bundled extractive summariser on Android and rejects honestly on iOS.
          Either way the result says which route ran.
        </Text>

        <TouchableOpacity style={styles.button} onPress={runSummarize} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Summarize the article</Text>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.provenance}>
              route: {result.tier}
              {result.degraded ? ' · degraded (not a language model)' : ''}
            </Text>
            <Text style={styles.resultText}>{result.value}</Text>
            <Text style={styles.attempts}>
              {result.attempts
                .map((a) => `${a.tier}: ${a.ok ? 'ok' : (a.error ?? 'skipped')}`)
                .join('\n')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 48 },
  h1: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  h2: { fontSize: 17, fontWeight: '600', marginTop: 28, marginBottom: 6 },
  device: { fontSize: 13, color: '#57606a', marginBottom: 4 },
  note: { fontSize: 12, color: '#57606a', marginBottom: 12, lineHeight: 17 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d0d7de',
  },
  rowRight: { alignItems: 'flex-end', flexShrink: 1, paddingLeft: 12 },
  feature: { fontSize: 14, fontFamily: 'Menlo' },
  state: { fontSize: 13, fontWeight: '600' },
  reason: { fontSize: 11, color: '#57606a' },
  permanent: { fontSize: 10, color: '#82071e' },
  button: {
    backgroundColor: '#0969da',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  resultBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#f6f8fa',
    borderRadius: 8,
  },
  provenance: { fontSize: 12, fontWeight: '600', color: '#57606a', marginBottom: 8 },
  resultText: { fontSize: 14, lineHeight: 20 },
  attempts: { fontSize: 11, color: '#57606a', marginTop: 10, fontFamily: 'Menlo' },
  errorBox: {
    backgroundColor: '#fff8f8',
    borderColor: '#ffcecb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#82071e', fontSize: 12, fontFamily: 'Menlo' },
});
