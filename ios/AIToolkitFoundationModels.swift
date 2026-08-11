// react-native-ai-gateway — https://github.com/anivar/react-native-ai-gateway
//
// Apple Foundation Models bridge for react-native-ai-gateway.
// Requires iOS 26+ on Apple-Intelligence-capable hardware (A17 Pro, M-series).
// On older OS or unsupported hardware the Objective-C++ caller must guard with
// @available and SystemLanguageModel.default.availability before invoking us.

import Foundation

#if canImport(FoundationModels)
import FoundationModels
#endif

public typealias AIPromiseResolve = (Any?) -> Void
public typealias AIPromiseReject = (String?, String?, Error?) -> Void

@objc(AIToolkitFoundationModels)
@objcMembers
public final class AIToolkitFoundationModels: NSObject {

  // MARK: - Availability

  @objc public class func isAvailable() -> Bool {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, macOS 26.0, *) {
      switch SystemLanguageModel.default.availability {
      case .available: return true
      default: return false
      }
    }
    #endif
    return false
  }

  /**
   Availability as a state token rather than a Bool.

   `.modelNotReady` is the case a Bool cannot carry: the device is eligible,
   the user has Apple Intelligence on, and the model is still downloading. It
   reported identically to "this iPhone will never do this", so a UI had no way
   to show a spinner instead of hiding the feature.

   Returns one of: available, downloading, unavailable.
   */
  @objc public class func availabilityState() -> String {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, macOS 26.0, *) {
      switch SystemLanguageModel.default.availability {
      case .available: return "available"
      case .unavailable(.modelNotReady): return "downloading"
      default: return "unavailable"
      }
    }
    #endif
    return "unavailable"
  }

  /** The machine-readable reason, matching the UnavailableReason union in TS. */
  @objc public class func availabilityReason() -> String {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, macOS 26.0, *) {
      switch SystemLanguageModel.default.availability {
      case .available:
        return ""
      case .unavailable(.deviceNotEligible):
        return "hardware-ineligible"
      case .unavailable(.appleIntelligenceNotEnabled):
        return "user-disabled"
      case .unavailable(.modelNotReady):
        return "model-not-ready"
      default:
        return "unknown"
      }
    }
    #endif
    // Reached on any SDK older than iOS 26, where the framework does not exist.
    return "os-too-old"
  }

  @objc public class func unavailableReason() -> String {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, macOS 26.0, *) {
      switch SystemLanguageModel.default.availability {
      case .available:
        return ""
      case .unavailable(.deviceNotEligible):
        return "Device does not support Apple Intelligence."
      case .unavailable(.appleIntelligenceNotEnabled):
        return "Apple Intelligence is turned off in Settings."
      case .unavailable(.modelNotReady):
        return "Apple Intelligence model is still downloading."
      case .unavailable(let reason):
        return "Apple Intelligence unavailable: \(reason)."
      @unknown default:
        return "Apple Intelligence unavailable for an unknown reason."
      }
    }
    #endif
    return "Foundation Models requires iOS 26 or later."
  }

  // MARK: - Generate

  @objc public class func generate(
    prompt: String,
    maxOutputTokens: NSNumber?,
    temperature: NSNumber?,
    resolver resolve: @escaping AIPromiseResolve,
    rejecter reject: @escaping AIPromiseReject
  ) {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, macOS 26.0, *) {
      Task {
        do {
          let session = LanguageModelSession()
          let opts = makeOptions(maxOutputTokens: maxOutputTokens, temperature: temperature)
          let response = try await session.respond(to: prompt, options: opts)
          resolve(response.content)
        } catch {
          reject("GENERATION_FAILED", error.localizedDescription, error)
        }
      }
      return
    }
    #endif
    reject("UNSUPPORTED_PLATFORM", "Foundation Models requires iOS 26.", nil)
  }

  // MARK: - Summarize

  @objc public class func summarize(
    text: String,
    format: String,
    resolver resolve: @escaping AIPromiseResolve,
    rejecter reject: @escaping AIPromiseReject
  ) {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, macOS 26.0, *) {
      let instruction: String
      switch format {
      case "headline":
        instruction = "Write a single-line headline that captures the main point of the text. Output only the headline."
      case "one-bullet":
        instruction = "Summarize the text as one concise bullet point starting with '- '. Output only the bullet."
      default: // "bullets"
        instruction = "Summarize the text as 3 to 5 concise bullet points, each starting with '- '. Output only the bullets, one per line."
      }
      Task {
        do {
          let session = LanguageModelSession(instructions: instruction)
          let response = try await session.respond(to: text)
          resolve(response.content)
        } catch {
          reject("SUMMARIZATION_FAILED", error.localizedDescription, error)
        }
      }
      return
    }
    #endif
    reject("UNSUPPORTED_PLATFORM", "Foundation Models requires iOS 26.", nil)
  }

  // MARK: - Rewrite

  @objc public class func rewrite(
    text: String,
    style: String,
    resolver resolve: @escaping AIPromiseResolve,
    rejecter reject: @escaping AIPromiseReject
  ) {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, macOS 26.0, *) {
      let instruction: String
      switch style {
      case "professional":
        instruction = "Rewrite the user's text in a professional, business-appropriate tone. Preserve meaning. Output only the rewritten text."
      case "friendly":
        instruction = "Rewrite the user's text in a warm, friendly tone. Preserve meaning. Output only the rewritten text."
      case "casual":
        instruction = "Rewrite the user's text in a casual, conversational tone. Preserve meaning. Output only the rewritten text."
      case "concise":
        instruction = "Rewrite the user's text more concisely while preserving meaning. Output only the rewritten text."
      case "creative":
        instruction = "Rewrite the user's text more creatively and vividly while preserving meaning. Output only the rewritten text."
      case "elaborate":
        instruction = "Expand and elaborate on the user's text while preserving meaning. Output only the rewritten text."
      default: // "rephrase"
        instruction = "Rephrase the user's text in clear, natural English while preserving meaning. Output only the rewritten text."
      }
      Task {
        do {
          let session = LanguageModelSession(instructions: instruction)
          let response = try await session.respond(to: text)
          resolve(response.content)
        } catch {
          reject("REWRITE_FAILED", error.localizedDescription, error)
        }
      }
      return
    }
    #endif
    reject("UNSUPPORTED_PLATFORM", "Foundation Models requires iOS 26.", nil)
  }

  // MARK: - Chat (multi-turn)

  @objc public class func chat(
    messages: [[String: Any]],
    maxOutputTokens: NSNumber?,
    temperature: NSNumber?,
    resolver resolve: @escaping AIPromiseResolve,
    rejecter reject: @escaping AIPromiseReject
  ) {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, macOS 26.0, *) {
      // Extract optional system message + flatten remaining turns into a single
      // tagged prompt. Foundation Models keeps history via `instructions` +
      // a single respond() call; we don't persist sessions across JS calls.
      var instructions: String?
      var turns: [String] = []
      for raw in messages {
        guard
          let role = raw["role"] as? String,
          let content = raw["content"] as? String
        else { continue }
        if role == "system" {
          instructions = content
        } else {
          turns.append("\(role.capitalized): \(content)")
        }
      }
      if turns.isEmpty {
        reject("INVALID_INPUT", "chat() requires at least one non-system message.", nil)
        return
      }
      let prompt = turns.joined(separator: "\n") + "\nAssistant:"
      Task {
        do {
          let session = LanguageModelSession(instructions: instructions)
          let opts = makeOptions(maxOutputTokens: maxOutputTokens, temperature: temperature)
          let response = try await session.respond(to: prompt, options: opts)
          resolve(response.content)
        } catch {
          reject("CHAT_FAILED", error.localizedDescription, error)
        }
      }
      return
    }
    #endif
    reject("UNSUPPORTED_PLATFORM", "Foundation Models requires iOS 26.", nil)
  }

  // MARK: - Helpers

  #if canImport(FoundationModels)
  @available(iOS 26.0, macOS 26.0, *)
  private class func makeOptions(
    maxOutputTokens: NSNumber?,
    temperature: NSNumber?
  ) -> GenerationOptions {
    var opts = GenerationOptions()
    if let t = temperature?.doubleValue {
      opts.temperature = t
    }
    if let m = maxOutputTokens?.intValue {
      opts.maximumResponseTokens = m
    }
    return opts
  }
  #endif
}
