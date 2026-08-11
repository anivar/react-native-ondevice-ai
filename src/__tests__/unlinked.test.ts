/**
 * The unlinked-module contract.
 *
 * With no native module present — Expo Go, react-native-web, the old
 * architecture, a missing pod — importing this package must succeed and the
 * calls must reject. Previously `getEnforcing` threw during import, so a
 * capability check written defensively still white-screened the app.
 *
 * The react-native mock returns null from `TurboModuleRegistry.get`, so every
 * test here runs against a genuinely unlinked module rather than a simulated
 * one.
 */

import { ErrorCodes, isAIError } from '../errors';

describe('with the native module unlinked', () => {
  it('imports without throwing', () => {
    expect(() => require('../index')).not.toThrow();
  });

  it('rejects async calls with MODULE_NOT_LINKED rather than throwing', async () => {
    const { summarizeText } = require('../index');

    // The call itself must not throw synchronously: it is documented as
    // returning a promise, and a sync throw escapes a try/catch written around
    // an await.
    let promise: Promise<unknown> | undefined;
    expect(() => {
      promise = summarizeText('hello');
    }).not.toThrow();

    await expect(promise).rejects.toMatchObject({
      code: ErrorCodes.MODULE_NOT_LINKED,
      feature: 'summarizeText',
    });
  });

  it('names the feature that was called', async () => {
    const { scanBarcodes } = require('../index');
    await scanBarcodes('x').catch((e: unknown) => {
      expect(isAIError(e)).toBe(true);
      if (isAIError(e)) {
        expect(e.feature).toBe('scanBarcodes');
        expect(e.platformCode).toBe('MODULE_NOT_LINKED');
        expect(e.message).toMatch(/Expo Go/);
      }
    });
    expect.hasAssertions();
  });

  it('throws synchronously for the two synchronous methods', () => {
    const { isPrivateModeEnabled } = require('../index');
    expect(() => isPrivateModeEnabled()).toThrow(/not linked/);
  });
});
