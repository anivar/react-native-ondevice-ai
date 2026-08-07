require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "MobileAIToolkit"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  # 15.1 is React Native 0.80's own floor, and this package requires 0.80+.
  # The previous 14.0 could never have been satisfied.
  s.platforms    = { :ios => "15.1" }
  s.source       = { :git => "https://github.com/openslm-ai/mobile-ai-toolkit.git", :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{h,m,mm,swift}",
    "src/specs/*.ts"
  ]

  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "DEFINES_MODULE" => "YES"
  }

  # iOS AI frameworks
  # Only what the sources actually import. VisionKit, CreateML and AppIntents
  # were linked and never used; WritingTools was linked for an
  # NSClassFromString lookup, which needs no link at all.
  s.frameworks = [
    "Foundation",
    "Vision",
    "NaturalLanguage",
    "Speech",
    "AVFoundation",
    "CoreML"
  ]

  # iOS 26+, and additionally guarded by `#if canImport(FoundationModels)` in
  # the Swift source. Weak-linked so the dylib still loads on earlier OSes.
  s.weak_frameworks = ["FoundationModels"]

  # install_modules_dependencies handles React-Core, the codegen output and the
  # whole TurboModule dependency set for both architectures, and tracks them
  # across React Native releases. It replaces the hand-maintained list that was
  # here, which named a nonexistent `React` pod, referenced
  # `folly_compiler_flags` outside the script context that defines it, and
  # repeated the new-architecture block twice.
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
