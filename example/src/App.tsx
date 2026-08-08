/**
 * What this example is for.
 *
 * Not "look, AI in a text box" — every wrapper can show that on the one phone
 * the author owns. The interesting question for this package is what happens on
 * *your* device, which is very likely neither an AICore Android nor an
 * Apple-Intelligence iPhone. So this app leads with availability: what this
 * device can do, what it cannot, why, and whether that is permanent.
 *
 * Then it summarises an article and reports which route produced the result and
 * whether it was degraded, so a fallback is never mistaken for a model.
 */

import {
  type CallExplanation,
  type DeviceCapabilities,
  explainCall,
  getDeviceCapabilities,
  isAIError,
  type SummarizeResult,
  summarize,
} from 'mobile-ai-toolkit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { dark, light, stateColor, type Theme } from './theme';

const ARTICLE = [
  'The city council approved the new transit plan on Tuesday evening.',
  'The plan adds twelve bus routes and extends two rail lines into the eastern suburbs.',
  'Council members said the transit plan would cut average commute times across the city.',
  'Funding comes from a bond measure voters approved last year.',
  'Construction is expected to begin in the spring.',
].join(' ');

export default function App() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? dark : light;
  const s = useMemo(() => makeStyles(theme), [theme]);

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
        // point of the nullable registry lookup.
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
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.brandRow}>
          <View style={s.mark}>
            <Text style={s.markText}>SLM</Text>
          </View>
          <View>
            <Text style={s.brand}>OpenSLM</Text>
            <Text style={s.brandSub}>mobile-ai-toolkit</Text>
          </View>
        </View>

        <Text style={s.tagline}>On-device AI for React Native. Nothing leaves the device.</Text>

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {caps && (
          <Text style={s.device}>
            {caps.platform} {caps.osVersion}
            {caps.hasNeuralEngine ? ' · neural engine' : ''}
            {caps.hasGeminiNano ? ' · Gemini Nano' : ''}
            {caps.hasAppleIntelligence ? ' · Apple Intelligence' : ''}
          </Text>
        )}

        <Text style={s.h2}>What this device can do</Text>
        <Text style={s.note}>
          Straight from ML Kit's checkFeatureStatus() and Apple's SystemLanguageModel.availability —
          not a guess from which classes were compiled in.
        </Text>

        <View style={s.card}>
          {plans.map((plan, i) => (
            <View key={plan.feature} style={[s.row, i === plans.length - 1 && s.rowLast]}>
              <Text style={s.feature}>{plan.feature}</Text>
              <View style={s.rowRight}>
                <Text style={[s.state, { color: stateColor(theme, plan.availability.state) }]}>
                  {plan.availability.state}
                </Text>
                {plan.availability.reason && (
                  <Text style={s.reason}>{plan.availability.reason}</Text>
                )}
                {!plan.mayChangeLater && plan.availability.state === 'unavailable' && (
                  <Text style={s.permanent}>permanent on this device</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <Text style={s.h2}>Summarize</Text>
        <Text style={s.note}>
          With no generative model on this device, the call falls back to a bundled extractive
          summariser on Android and rejects honestly on iOS. Either way the result says which route
          ran.
        </Text>

        <TouchableOpacity style={s.button} onPress={runSummarize} disabled={busy}>
          {busy ? (
            <ActivityIndicator color={theme.paper} />
          ) : (
            <Text style={s.buttonText}>Summarize the article</Text>
          )}
        </TouchableOpacity>

        {result && (
          <View style={s.card}>
            <Text style={s.provenance}>
              route: {result.tier}
              {result.degraded ? ' · degraded (not a language model)' : ''}
            </Text>
            <Text style={s.resultText}>{result.value}</Text>
            <Text style={s.attempts}>
              {result.attempts
                .map((a) => `${a.tier}: ${a.ok ? 'ok' : (a.error ?? 'skipped')}`)
                .join('\n')}
            </Text>
          </View>
        )}

        <Text style={s.footer}>openslm.ai · Open Small Models Accord</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.paper },
    content: { padding: 20, paddingBottom: 48 },

    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    mark: {
      width: 42,
      height: 42,
      borderRadius: 6,
      backgroundColor: t.indigo,
      alignItems: 'center',
      justifyContent: 'center',
    },
    markText: { color: '#F5F1E8', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
    brand: { fontSize: 20, fontWeight: '700', color: t.ink, letterSpacing: -0.2 },
    brandSub: { fontSize: 13, color: t.inkMuted, fontFamily: 'Menlo' },

    tagline: { fontSize: 13, color: t.inkMuted, lineHeight: 18, marginBottom: 18 },
    device: { fontSize: 12, color: t.inkFaint, fontFamily: 'Menlo' },

    h2: {
      fontSize: 16,
      fontWeight: '700',
      color: t.ink,
      marginTop: 28,
      marginBottom: 6,
      letterSpacing: -0.2,
    },
    note: { fontSize: 12, color: t.inkMuted, marginBottom: 12, lineHeight: 17 },

    card: {
      backgroundColor: t.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.rule,
      paddingHorizontal: 14,
      paddingVertical: 4,
      marginTop: 6,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.rule,
    },
    rowLast: { borderBottomWidth: 0 },
    rowRight: { alignItems: 'flex-end', flexShrink: 1, paddingLeft: 12 },
    feature: { fontSize: 13, fontFamily: 'Menlo', color: t.ink },
    state: { fontSize: 13, fontWeight: '600' },
    reason: { fontSize: 11, color: t.inkFaint },
    permanent: { fontSize: 10, color: t.seal },

    button: {
      backgroundColor: t.indigo,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: { color: '#F5F1E8', fontWeight: '600', fontSize: 15 },

    provenance: {
      fontSize: 11,
      fontWeight: '700',
      color: t.inkMuted,
      paddingTop: 12,
      fontFamily: 'Menlo',
    },
    resultText: { fontSize: 14, lineHeight: 21, color: t.ink, paddingTop: 10 },
    attempts: {
      fontSize: 11,
      color: t.inkFaint,
      paddingTop: 12,
      paddingBottom: 12,
      fontFamily: 'Menlo',
    },

    errorBox: {
      backgroundColor: t.surface,
      borderColor: t.seal,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 14,
    },
    errorText: { color: t.seal, fontSize: 12, fontFamily: 'Menlo' },

    footer: {
      marginTop: 34,
      fontSize: 11,
      color: t.inkFaint,
      textAlign: 'center',
    },
  });
}
