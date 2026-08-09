// react-native-ondevice-ai — https://github.com/anivar/react-native-ondevice-ai
#import "AIToolkitTurboModule.h"
#import <Vision/Vision.h>
#import <NaturalLanguage/NaturalLanguage.h>
#import <Speech/Speech.h>
#import <CoreML/CoreML.h>
#import <AVFoundation/AVFoundation.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTConversions.h>
#import "AIToolkitTurboModuleSpec.h"
#endif

// CocoaPods generates this header from the pod's module name: s.name with each
// non-alphanumeric character replaced by an underscore. If it ever stops
// matching, __has_include simply fails and the Foundation Models bridge
// compiles out silently — which is what check-podspec.mjs guards against.
#if __has_include("react_native_ondevice_ai-Swift.h")
#import "react_native_ondevice_ai-Swift.h"
#define AI_HAS_FOUNDATION_BRIDGE 1
#endif

@implementation AIToolkitTurboModule

RCT_EXPORT_MODULE()

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeAIToolkitSpecJSI>(params);
}
#endif

#pragma mark - Device Capabilities

RCT_EXPORT_METHOD(getDeviceCapabilities:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    NSMutableDictionary *capabilities = [NSMutableDictionary dictionary];
    capabilities[@"platform"] = @"ios";
    capabilities[@"osVersion"] = [[UIDevice currentDevice] systemVersion];
    capabilities[@"hasNeuralEngine"] = @YES;
    capabilities[@"hasMLKitGenAI"] = @NO;
    capabilities[@"hasGeminiNano"] = @NO;

    // Generative availability, straight from SystemLanguageModel.availability.
    //
    // Nothing else will do. Probing for the WritingTools class, for instance,
    // answers YES on every iOS 18.1 device regardless of whether that device is
    // Apple-Intelligence eligible or has the feature switched on, so
    // hasAppleIntelligence would read YES on hardware where every generative
    // call rejects.
    NSString *genState = @"unavailable";
    NSString *genReason = @"os-too-old";
    NSString *genDetail = @"Foundation Models requires iOS 26 or later.";
#if AI_HAS_FOUNDATION_BRIDGE
    if (@available(iOS 26.0, *)) {
        genState = [AIToolkitFoundationModels availabilityState];
        genReason = [AIToolkitFoundationModels availabilityReason];
        genDetail = [AIToolkitFoundationModels unavailableReason];
    }
#endif
    BOOL hasFoundationModels = [genState isEqualToString:@"available"];
    capabilities[@"hasAppleIntelligence"] = @(hasFoundationModels);

    // supportsOnDeviceRecognition is an instance property, not a class method,
    // and it is per-locale: a device can have an offline model for one language
    // and not another. Probing the current locale is the honest answer for a
    // capability check.
    SFSpeechRecognizer *speechProbe =
        [[SFSpeechRecognizer alloc] initWithLocale:[NSLocale currentLocale]];
    BOOL hasOnDeviceSpeech = speechProbe != nil && speechProbe.supportsOnDeviceRecognition;
    capabilities[@"hasOnDeviceSpeech"] = @(hasOnDeviceSpeech);

    // NLLanguageRecognizer has no +supportedLanguages. The language list that
    // actually means something here is the set of locales speech recognition
    // supports — the only language-bound feature on this platform.
    NSMutableArray<NSString *> *languages = [NSMutableArray array];
    for (NSLocale *locale in [SFSpeechRecognizer supportedLocales]) {
        [languages addObject:locale.localeIdentifier];
    }
    [languages sortUsingSelector:@selector(compare:)];
    capabilities[@"supportedLanguages"] = languages;

    NSDictionary *(^ok)(void) = ^NSDictionary *{
        return @{ @"state": @"available", @"requiresNetwork": @NO };
    };
    NSDictionary *(^no)(NSString *, NSString *) = ^NSDictionary *(NSString *reason, NSString *detail) {
        return @{ @"state": @"unavailable", @"reason": reason,
                  @"detail": detail, @"requiresNetwork": @NO };
    };

    // The generative six share one answer, and it carries its own reason.
    NSDictionary *gen = hasFoundationModels
        ? ok()
        : @{ @"state": genState, @"reason": genReason,
             @"detail": genDetail, @"requiresNetwork": @NO };

    // `@available` is only valid as an if-condition, not inside an expression.
    // embedText (iOS 17+) and segmentPerson (iOS 15+) are both below the 17.0
    // deployment target, so they are simply present. The guards and their
    // unreachable `unavailable` branches are gone.
    NSDictionary *transcribe = hasOnDeviceSpeech
        ? ok()
        : no(@"hardware-ineligible",
             @"This device has no on-device speech recognition for the current locale.");

    NSDictionary *availability = @{
        @"analyzeText": ok(),
        @"analyzeImage": ok(),
        @"proofread": ok(),          // UITextChecker, spelling only — always present
        @"extractEntities": ok(),
        @"scanBarcodes": ok(),
        @"labelImage": ok(),
        @"segmentPerson": ok(),
        @"embedText": ok(),
        @"transcribe": transcribe,
        @"summarize": gen,
        @"rewrite": gen,
        @"generate": gen,
        @"chat": gen,
        @"describeImage": no(@"no-platform-api",
                             @"iOS has no on-device image captioning API."),
        @"smartReplies": no(@"no-platform-api",
                            @"iOS has no public smart-reply API."),
        @"translate": no(@"no-platform-api",
                         @"The Translation framework has no on-device string API."),
    };
    capabilities[@"availability"] = availability;


    resolve(capabilities);
}

#pragma mark - Text

static NSString *entityTypeFromTag(NLTag tag) {
    if ([tag isEqualToString:NLTagPersonalName]) return @"person";
    if ([tag isEqualToString:NLTagPlaceName]) return @"place";
    if ([tag isEqualToString:NLTagOrganizationName]) return @"organization";
    return @"other";
}

RCT_EXPORT_METHOD(analyzeText:(NSString *)text
                 options:(NSDictionary *)options
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    if (text.length == 0) {
        reject(@"INVALID_INPUT", @"Text cannot be empty", nil);
        return;
    }
    NSMutableDictionary *result = [NSMutableDictionary dictionary];

    NLLanguageRecognizer *recognizer = [[NLLanguageRecognizer alloc] init];
    [recognizer processString:text];
    NLLanguage dominantLanguage = [recognizer dominantLanguage];
    result[@"language"] = dominantLanguage ?: @"unknown";
    NSDictionary<NLLanguage, NSNumber *> *hypotheses = [recognizer languageHypothesesWithMaximum:1];
    result[@"confidence"] = hypotheses[dominantLanguage] ?: @0.0;

    if ([options[@"includeSentiment"] boolValue]) {
        NLTagger *tagger = [[NLTagger alloc] initWithTagSchemes:@[NLTagSchemeSentimentScore]];
        tagger.string = text;
        NLTag sentimentTag = [tagger tagAtIndex:0
                                          unit:NLTokenUnitDocument
                                        scheme:NLTagSchemeSentimentScore
                                    tokenRange:nil];
        result[@"sentiment"] = sentimentTag ? @([sentimentTag doubleValue]) : @0.0;
    }

    if ([options[@"includeEntities"] boolValue]) {
        result[@"entities"] = [self extractEntitiesSync:text];
    }

    resolve(result);
    
}

- (NSArray *)extractEntitiesSync:(NSString *)text {
    NLTagger *tagger = [[NLTagger alloc] initWithTagSchemes:@[NLTagSchemeNameType]];
    tagger.string = text;
    NSMutableArray *entities = [NSMutableArray array];
    NSRange range = NSMakeRange(0, text.length);
    NLTaggerOptions opts = NLTaggerOmitWhitespace |
                           NLTaggerOmitPunctuation |
                           NLTaggerJoinNames;
    [tagger enumerateTagsInRange:range
                            unit:NLTokenUnitWord
                          scheme:NLTagSchemeNameType
                         options:opts
                      usingBlock:^(NLTag tag, NSRange tokenRange, BOOL *stop) {
        if (tag) {
            [entities addObject:@{
                @"text": [text substringWithRange:tokenRange],
                @"type": entityTypeFromTag(tag),
                @"confidence": @0.85,
                @"range": @[@(tokenRange.location), @(tokenRange.location + tokenRange.length)]
            }];
        }
    }];
    return entities;
}

RCT_EXPORT_METHOD(extractEntities:(NSString *)text
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    resolve([self extractEntitiesSync:text]);
    
}

RCT_EXPORT_METHOD(identifyLanguage:(NSString *)text
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    NLLanguageRecognizer *recognizer = [[NLLanguageRecognizer alloc] init];
    [recognizer processString:text];
    resolve([recognizer dominantLanguage] ?: @"unknown");
}

#pragma mark - Image

RCT_EXPORT_METHOD(analyzeImage:(NSString *)imageBase64
                 options:(NSDictionary *)options
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    NSData *imageData = [[NSData alloc] initWithBase64EncodedString:imageBase64
                                                            options:NSDataBase64DecodingIgnoreUnknownCharacters];
    UIImage *image = [UIImage imageWithData:imageData];
    if (!image || !image.CGImage) {
        reject(@"INVALID_IMAGE", @"Failed to decode image", nil);
        return;
    }

    CIImage *ciImage = [CIImage imageWithCGImage:image.CGImage];
    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    result[@"text"] = @"";
    result[@"objects"] = @[];
    result[@"faces"] = @[];

    NSMutableArray<VNRequest *> *requests = [NSMutableArray array];
    dispatch_group_t group = dispatch_group_create();

    if ([options[@"extractText"] boolValue]) {
        dispatch_group_enter(group);
        VNRecognizeTextRequest *textRequest = [[VNRecognizeTextRequest alloc] initWithCompletionHandler:^(VNRequest *req, NSError *error) {
            if (!error) {
                NSMutableString *acc = [NSMutableString string];
                for (VNRecognizedTextObservation *obs in req.results) {
                    VNRecognizedText *top = [obs topCandidates:1].firstObject;
                    if (top) {
                        if (acc.length > 0) [acc appendString:@" "];
                        [acc appendString:top.string];
                    }
                }
                result[@"text"] = [acc copy];
            }
            dispatch_group_leave(group);
        }];
        textRequest.recognitionLevel = VNRequestTextRecognitionLevelAccurate;
        [requests addObject:textRequest];
    }

    if ([options[@"detectFaces"] boolValue]) {
        dispatch_group_enter(group);
        VNDetectFaceRectanglesRequest *faceRequest = [[VNDetectFaceRectanglesRequest alloc] initWithCompletionHandler:^(VNRequest *req, NSError *error) {
            if (!error) {
                NSMutableArray *faces = [NSMutableArray array];
                for (VNFaceObservation *face in req.results) {
                    [faces addObject:@{
                        @"bounds": @{
                            @"x": @(face.boundingBox.origin.x * image.size.width),
                            @"y": @(face.boundingBox.origin.y * image.size.height),
                            @"width": @(face.boundingBox.size.width * image.size.width),
                            @"height": @(face.boundingBox.size.height * image.size.height)
                        }
                    }];
                }
                result[@"faces"] = faces;
            }
            dispatch_group_leave(group);
        }];
        [requests addObject:faceRequest];
    }

    // No object detection on iOS. Vision has no general-purpose object
    // detector, and VNGenerateForegroundInstanceMaskRequest — which was used
    // here — returns VNInstanceMaskObservation, which has no boundingBox to
    // build an ImageAnalysis.object from. It segments foreground; it does not
    // say what the foreground is.
    //
    // `objects` therefore stays empty on iOS and is populated by ML Kit on
    // Android. getDeviceCapabilities reports this difference rather than
    // hiding it.

    if (requests.count == 0) {
        resolve(result);
        return;
    }

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:ciImage options:@{}];
        NSError *error = nil;
        [handler performRequests:requests error:&error];
        dispatch_group_notify(group, dispatch_get_main_queue(), ^{
            resolve(result);
        });
    });
}

#pragma mark - Proofread

RCT_EXPORT_METHOD(proofreadText:(NSString *)text
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    UITextChecker *checker = [[UITextChecker alloc] init];
    NSMutableArray *corrections = [NSMutableArray array];
    NSMutableString *correctedText = [text mutableCopy];

    NSInteger offset = 0;
    NSRange searchRange = NSMakeRange(0, text.length);
    while (searchRange.location < text.length) {
        NSRange misspelledRange = [checker rangeOfMisspelledWordInString:text
                                                                   range:searchRange
                                                              startingAt:searchRange.location
                                                                    wrap:NO
                                                                language:@"en_US"];
        if (misspelledRange.location == NSNotFound) break;

        NSArray<NSString *> *guesses = [checker guessesForWordRange:misspelledRange
                                                           inString:text
                                                           language:@"en_US"];
        NSString *original = [text substringWithRange:misspelledRange];
        NSString *correction = guesses.firstObject;
        if (correction) {
            [corrections addObject:@{
                @"original": original,
                @"corrected": correction,
                @"type": @"spelling",
                @"position": @[@(misspelledRange.location), @(misspelledRange.location + misspelledRange.length)]
            }];
            NSRange targetRange = NSMakeRange(misspelledRange.location + offset, misspelledRange.length);
            [correctedText replaceCharactersInRange:targetRange withString:correction];
            offset += (NSInteger)correction.length - (NSInteger)misspelledRange.length;
        }
        NSUInteger nextStart = misspelledRange.location + misspelledRange.length;
        if (nextStart >= text.length) break;
        searchRange = NSMakeRange(nextStart, text.length - nextStart);
    }

    resolve(@{
        @"correctedText": correctedText,
        @"corrections": corrections
    });
}

#pragma mark - Generative

// On iOS 26+ with Apple-Intelligence-eligible hardware these methods route to
// the Foundation Models bridge (AIToolkitFoundationModels.swift). Otherwise
// they reject FEATURE_UNAVAILABLE / UNSUPPORTED_PLATFORM with a precise reason.


static NSString *AI_FoundationModelsUnavailableReason(void) {
#if AI_HAS_FOUNDATION_BRIDGE
    if (@available(iOS 26.0, *)) {
        return [AIToolkitFoundationModels unavailableReason];
    }
#endif
    return @"Foundation Models requires iOS 26 and Apple Intelligence.";
}

RCT_EXPORT_METHOD(summarizeText:(NSString *)text
                 format:(NSString *)format
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    if (text.length == 0) {
        reject(@"INVALID_INPUT", @"Text cannot be empty", nil);
        return;
    }
#if AI_HAS_FOUNDATION_BRIDGE
    if (@available(iOS 26.0, *)) {
        if ([AIToolkitFoundationModels isAvailable]) {
            [AIToolkitFoundationModels summarizeWithText:text
                                                  format:(format ?: @"bullets")
                                                resolver:resolve
                                                rejecter:reject];
            return;
        }
    }
#endif
    reject(@"FEATURE_UNAVAILABLE", AI_FoundationModelsUnavailableReason(), nil);
}

RCT_EXPORT_METHOD(rewriteText:(NSString *)text
                 style:(NSString *)style
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    if (text.length == 0) {
        reject(@"INVALID_INPUT", @"Text cannot be empty", nil);
        return;
    }
#if AI_HAS_FOUNDATION_BRIDGE
    if (@available(iOS 26.0, *)) {
        if ([AIToolkitFoundationModels isAvailable]) {
            [AIToolkitFoundationModels rewriteWithText:text
                                                 style:(style ?: @"rephrase")
                                              resolver:resolve
                                              rejecter:reject];
            return;
        }
    }
#endif
    reject(@"FEATURE_UNAVAILABLE", AI_FoundationModelsUnavailableReason(), nil);
}

RCT_EXPORT_METHOD(smartReplies:(NSArray *)messages
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    reject(@"UNSUPPORTED_PLATFORM",
           @"Smart Reply is not available on iOS (Android-only via ML Kit).",
           nil);
}

RCT_EXPORT_METHOD(translateText:(NSString *)text
                 sourceLang:(NSString *)sourceLang
                 targetLang:(NSString *)targetLang
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    reject(@"UNSUPPORTED_PLATFORM",
           @"iOS Translation framework requires SwiftUI host integration; tracked for v2.2. On Android use ML Kit Translator.",
           nil);
}

RCT_EXPORT_METHOD(generateText:(NSString *)prompt
                 options:(NSDictionary *)options
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    if (prompt.length == 0) {
        reject(@"INVALID_INPUT", @"Prompt cannot be empty", nil);
        return;
    }
#if AI_HAS_FOUNDATION_BRIDGE
    if (@available(iOS 26.0, *)) {
        if ([AIToolkitFoundationModels isAvailable]) {
            NSNumber *maxTokens = options[@"maxOutputTokens"];
            NSNumber *temperature = options[@"temperature"];
            [AIToolkitFoundationModels generateWithPrompt:prompt
                                          maxOutputTokens:maxTokens
                                              temperature:temperature
                                                 resolver:resolve
                                                 rejecter:reject];
            return;
        }
    }
#endif
    reject(@"FEATURE_UNAVAILABLE", AI_FoundationModelsUnavailableReason(), nil);
}

RCT_EXPORT_METHOD(chat:(NSArray *)messages
                 options:(NSDictionary *)options
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    if (messages.count == 0) {
        reject(@"INVALID_INPUT", @"chat() requires at least one message.", nil);
        return;
    }
#if AI_HAS_FOUNDATION_BRIDGE
    if (@available(iOS 26.0, *)) {
        if ([AIToolkitFoundationModels isAvailable]) {
            NSNumber *maxTokens = options[@"maxOutputTokens"];
            NSNumber *temperature = options[@"temperature"];
            [AIToolkitFoundationModels chatWithMessages:messages
                                        maxOutputTokens:maxTokens
                                            temperature:temperature
                                               resolver:resolve
                                               rejecter:reject];
            return;
        }
    }
#endif
    reject(@"FEATURE_UNAVAILABLE", AI_FoundationModelsUnavailableReason(), nil);
}

RCT_EXPORT_METHOD(describeImage:(NSString *)imageBase64
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    reject(@"UNSUPPORTED_PLATFORM",
           @"Apple Intelligence's on-device foundation model is text-only; no public iOS image-description API. Use labelImage() / scanBarcodes() / analyzeImage() for visual data.",
           nil);
}

#pragma mark - Embeddings

RCT_EXPORT_METHOD(embedText:(NSString *)text
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    NLLanguageRecognizer *rec = [[NLLanguageRecognizer alloc] init];
    [rec processString:text];
    NLLanguage lang = [rec dominantLanguage] ?: NLLanguageEnglish;

    NLContextualEmbedding *embedding = [NLContextualEmbedding contextualEmbeddingWithLanguage:lang];
    if (!embedding) {
        reject(@"EMBEDDING_UNAVAILABLE",
               [NSString stringWithFormat:@"No contextual embedding available for language %@", lang], nil);
        return;
    }

    // There is no `isLoaded`. Loading is idempotent, so attempt it and treat
    // failure as "assets are probably missing", which is the only recoverable
    // case anyway.
    NSError *loadError = nil;
    {
        BOOL ok = [embedding loadWithError:&loadError];
        if (!ok) {
            if (![embedding hasAvailableAssets]) {
                [embedding requestEmbeddingAssetsWithCompletionHandler:^(NLContextualEmbeddingAssetsResult result, NSError *err) {
                    if (result == NLContextualEmbeddingAssetsResultAvailable) {
                        NSError *retryErr = nil;
                        if ([embedding loadWithError:&retryErr]) {
                            [self computeAndResolveEmbedding:embedding text:text resolve:resolve reject:reject];
                        } else {
                            reject(@"EMBEDDING_LOAD_FAILED", retryErr.localizedDescription ?: @"unknown", retryErr);
                        }
                    } else {
                        reject(@"EMBEDDING_ASSETS_UNAVAILABLE",
                               err.localizedDescription ?: @"Asset download failed", err);
                    }
                }];
            } else {
                reject(@"EMBEDDING_LOAD_FAILED", loadError.localizedDescription ?: @"unknown", loadError);
            }
            return;
        }
    }

    [self computeAndResolveEmbedding:embedding text:text resolve:resolve reject:reject];
    
}

- (void)computeAndResolveEmbedding:(NLContextualEmbedding *)embedding
                              text:(NSString *)text
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject
{
    NSError *err = nil;
    NLContextualEmbeddingResult *result = [embedding embeddingResultForString:text language:nil error:&err];
    if (err || !result) {
        reject(@"EMBEDDING_ERROR", err.localizedDescription ?: @"Failed to compute embedding", err);
        return;
    }
    // NLContextualEmbeddingResult has no `embeddingArray`. Token vectors are
    // enumerated, so mean-pool over them in one pass: a per-token embedding is
    // not what a caller asking for "the embedding of this string" wants, and
    // mean pooling is the conventional reduction.
    NSUInteger dimension = embedding.dimension;
    NSMutableArray<NSNumber *> *sums = [NSMutableArray arrayWithCapacity:dimension];
    for (NSUInteger i = 0; i < dimension; i++) {
        [sums addObject:@0.0];
    }

    __block NSUInteger tokenCount = 0;
    [result enumerateTokenVectorsInRange:NSMakeRange(0, text.length)
                              usingBlock:^(NSArray<NSNumber *> *tokenVector, NSRange tokenRange, BOOL *stop) {
        for (NSUInteger i = 0; i < dimension && i < tokenVector.count; i++) {
            sums[i] = @(sums[i].doubleValue + tokenVector[i].doubleValue);
        }
        tokenCount++;
    }];

    if (tokenCount == 0) {
        reject(@"EMBEDDING_ERROR", @"The model returned no token vectors for this text", nil);
        return;
    }

    NSMutableArray<NSNumber *> *vector = [NSMutableArray arrayWithCapacity:dimension];
    for (NSUInteger i = 0; i < dimension; i++) {
        [vector addObject:@(sums[i].doubleValue / (double)tokenCount)];
    }
    resolve(vector);
}

#pragma mark - Vision (extras)

RCT_EXPORT_METHOD(scanBarcodes:(NSString *)imageBase64
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    NSData *data = [[NSData alloc] initWithBase64EncodedString:imageBase64
                                                       options:NSDataBase64DecodingIgnoreUnknownCharacters];
    UIImage *image = [UIImage imageWithData:data];
    if (!image || !image.CGImage) {
        reject(@"INVALID_IMAGE", @"Failed to decode image", nil);
        return;
    }
    CIImage *ciImage = [CIImage imageWithCGImage:image.CGImage];
    VNDetectBarcodesRequest *req = [[VNDetectBarcodesRequest alloc] initWithCompletionHandler:^(VNRequest *r, NSError *error) {
        if (error) { reject(@"BARCODE_ERROR", error.localizedDescription, error); return; }
        NSMutableArray *out = [NSMutableArray array];
        for (VNBarcodeObservation *obs in r.results) {
            [out addObject:@{
                @"rawValue": obs.payloadStringValue ?: @"",
                @"format": obs.symbology ?: @"unknown",
                @"bounds": @{
                    @"x": @(obs.boundingBox.origin.x * image.size.width),
                    @"y": @(obs.boundingBox.origin.y * image.size.height),
                    @"width": @(obs.boundingBox.size.width * image.size.width),
                    @"height": @(obs.boundingBox.size.height * image.size.height)
                }
            }];
        }
        resolve(out);
    }];
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:ciImage options:@{}];
        NSError *err = nil;
        if (![handler performRequests:@[req] error:&err]) {
            reject(@"BARCODE_HANDLER_ERROR", err.localizedDescription ?: @"failed", err);
        }
    });
}

RCT_EXPORT_METHOD(labelImage:(NSString *)imageBase64
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    NSData *data = [[NSData alloc] initWithBase64EncodedString:imageBase64
                                                       options:NSDataBase64DecodingIgnoreUnknownCharacters];
    UIImage *image = [UIImage imageWithData:data];
    if (!image || !image.CGImage) {
        reject(@"INVALID_IMAGE", @"Failed to decode image", nil);
        return;
    }
    CIImage *ciImage = [CIImage imageWithCGImage:image.CGImage];
    VNClassifyImageRequest *req = [[VNClassifyImageRequest alloc] initWithCompletionHandler:^(VNRequest *r, NSError *error) {
        if (error) { reject(@"LABEL_ERROR", error.localizedDescription, error); return; }
        NSMutableArray *out = [NSMutableArray array];
        for (VNClassificationObservation *obs in r.results) {
            if (obs.confidence < 0.1f) continue;
            [out addObject:@{ @"label": obs.identifier, @"confidence": @(obs.confidence) }];
            if (out.count >= 10) break;
        }
        resolve(out);
    }];
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:ciImage options:@{}];
        NSError *err = nil;
        if (![handler performRequests:@[req] error:&err]) {
            reject(@"LABEL_HANDLER_ERROR", err.localizedDescription ?: @"failed", err);
        }
    });
    
}

RCT_EXPORT_METHOD(segmentPerson:(NSString *)imageBase64
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    NSData *data = [[NSData alloc] initWithBase64EncodedString:imageBase64
                                                       options:NSDataBase64DecodingIgnoreUnknownCharacters];
    UIImage *image = [UIImage imageWithData:data];
    if (!image || !image.CGImage) {
        reject(@"INVALID_IMAGE", @"Failed to decode image", nil);
        return;
    }
    CIImage *ciImage = [CIImage imageWithCGImage:image.CGImage];
    VNGeneratePersonSegmentationRequest *req = [[VNGeneratePersonSegmentationRequest alloc] initWithCompletionHandler:^(VNRequest *r, NSError *error) {
        if (error) { reject(@"SEGMENT_ERROR", error.localizedDescription, error); return; }
        VNPixelBufferObservation *obs = r.results.firstObject;
        if (!obs) { reject(@"SEGMENT_NO_RESULT", @"No segmentation result", nil); return; }
        CVPixelBufferRef buffer = obs.pixelBuffer;
        CIImage *maskImage = [CIImage imageWithCVPixelBuffer:buffer];
        CIContext *ctx = [CIContext context];
        size_t w = CVPixelBufferGetWidth(buffer);
        size_t h = CVPixelBufferGetHeight(buffer);
        CGImageRef cgImage = [ctx createCGImage:maskImage fromRect:CGRectMake(0, 0, w, h)];
        if (!cgImage) { reject(@"SEGMENT_RENDER_FAILED", @"Could not render mask", nil); return; }
        UIImage *uiMask = [UIImage imageWithCGImage:cgImage];
        CGImageRelease(cgImage);
        NSData *pngData = UIImagePNGRepresentation(uiMask);
        NSString *b64 = [pngData base64EncodedStringWithOptions:0];
        resolve(@{
            @"maskBase64": b64 ?: @"",
            @"width": @(w),
            @"height": @(h)
        });
    }];
    req.qualityLevel = VNGeneratePersonSegmentationRequestQualityLevelBalanced;
    req.outputPixelFormat = kCVPixelFormatType_OneComponent8;
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:ciImage options:@{}];
        NSError *err = nil;
        if (![handler performRequests:@[req] error:&err]) {
            reject(@"SEGMENT_HANDLER_ERROR", err.localizedDescription ?: @"failed", err);
        }
    });
    
}

#pragma mark - Speech (real, on-device)

RCT_EXPORT_METHOD(transcribeAudioFile:(NSString *)filePath
                 options:(NSDictionary *)options
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    // Speech recognition needs the user's permission before anything else works.
    // Without this call SFSpeechRecognizer.isAvailable is NO, so every request
    // failed as RECOGNIZER_UNAVAILABLE — which reads as "your device cannot do
    // this" when the truth is "nobody has been asked yet". Authorization is
    // required even with requiresOnDeviceRecognition = YES.
    //
    // Your app needs NSSpeechRecognitionUsageDescription in its Info.plist; iOS
    // terminates the process on the first request if it is missing.
    [SFSpeechRecognizer requestAuthorization:^(SFSpeechRecognizerAuthorizationStatus status) {
        // The callback is not guaranteed to be on the main queue, and the work
        // below touches nothing thread-confined, but the promise blocks are
        // safest resolved off a known queue.
        dispatch_async(dispatch_get_main_queue(), ^{
            switch (status) {
                case SFSpeechRecognizerAuthorizationStatusAuthorized:
                    break;
                case SFSpeechRecognizerAuthorizationStatusDenied:
                    reject(@"SPEECH_PERMISSION_DENIED",
                           @"The user declined speech recognition. It can be re-enabled "
                           @"in Settings > Privacy & Security > Speech Recognition.", nil);
                    return;
                case SFSpeechRecognizerAuthorizationStatusRestricted:
                    reject(@"SPEECH_PERMISSION_RESTRICTED",
                           @"Speech recognition is restricted on this device, most often "
                           @"by parental controls or an MDM policy.", nil);
                    return;
                case SFSpeechRecognizerAuthorizationStatusNotDetermined:
                default:
                    reject(@"SPEECH_PERMISSION_DENIED",
                           @"Speech recognition authorization was not granted.", nil);
                    return;
            }
            [self transcribeAuthorized:filePath options:options resolve:resolve reject:reject];
        });
    }];
}

- (void)transcribeAuthorized:(NSString *)filePath
                     options:(NSDictionary *)options
                    resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
    NSString *localeId = options[@"locale"] ?: @"en-US";
    NSLocale *locale = [NSLocale localeWithLocaleIdentifier:localeId];
    SFSpeechRecognizer *recognizer = [[SFSpeechRecognizer alloc] initWithLocale:locale];
    if (!recognizer) {
        reject(@"UNSUPPORTED_LOCALE", [NSString stringWithFormat:@"Locale %@ is not supported", localeId], nil);
        return;
    }
    if (!recognizer.isAvailable) {
        reject(@"RECOGNIZER_UNAVAILABLE", @"Speech recognizer is not currently available", nil);
        return;
    }
    // Instance property, and per-locale: this recognizer, for this language.
    if (!recognizer.supportsOnDeviceRecognition) {
        reject(@"ON_DEVICE_UNSUPPORTED",
               [NSString stringWithFormat:
                @"On-device recognition is not available for %@ on this device. "
                @"Another locale may work; this package never falls back to Apple's servers.",
                localeId],
               nil);
        return;
    }

    NSURL *url = [NSURL fileURLWithPath:filePath];
    if (![[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
        reject(@"FILE_NOT_FOUND", [NSString stringWithFormat:@"Audio file not found: %@", filePath], nil);
        return;
    }

    SFSpeechURLRecognitionRequest *request = [[SFSpeechURLRecognitionRequest alloc] initWithURL:url];
    request.requiresOnDeviceRecognition = YES;
    request.shouldReportPartialResults = NO;
    if ([options[@"enablePunctuation"] boolValue]) {
        request.addsPunctuation = YES;
    }

    [recognizer recognitionTaskWithRequest:request resultHandler:^(SFSpeechRecognitionResult *result, NSError *error) {
        if (error) {
            reject(@"RECOGNITION_ERROR", error.localizedDescription, error);
            return;
        }
        if (result.isFinal) {
            SFTranscription *best = result.bestTranscription;
            float avgConfidence = 0.0f;
            if (best.segments.count > 0) {
                float sum = 0.0f;
                for (SFTranscriptionSegment *seg in best.segments) sum += seg.confidence;
                avgConfidence = sum / best.segments.count;
            }
            resolve(@{
                @"text": best.formattedString ?: @"",
                @"confidence": @(avgConfidence),
                @"locale": localeId
            });
        }
    }];
    
}

#pragma mark - Privacy

static BOOL privateMode = NO;

BOOL AIToolkitPrivateModeEnabled(void) { return privateMode; }

/**
 * On iOS every framework this module uses runs on-device with no network:
 * Vision, NaturalLanguage, UITextChecker, Foundation Models, and
 * SFSpeechRecognizer with requiresOnDeviceRecognition = YES. There is no
 * download path here as there is on Android, so private mode has nothing to
 * block on this platform. It is a no-op, and saying so is better than leaving
 * a stored value that looks like a control.
 *
 * The one place it might have mattered — speech recognition falling back to
 * Apple's servers — is already closed unconditionally, for every caller,
 * private mode or not.
 */
RCT_EXPORT_METHOD(enablePrivateMode:(BOOL)enabled)
{
    privateMode = enabled;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isPrivateModeEnabled)
{
    return @(privateMode);
}

@end
