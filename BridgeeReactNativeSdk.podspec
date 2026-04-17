require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "BridgeeReactNativeSdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = { "Bridgee.ai" => "contato@bridgee.ai" }

  s.platforms    = { :ios => "14.0" }
  s.source       = { :git => "https://github.com/bridgee-ai/bridgee-react-native-sdk.git", :tag => "v#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.swift_version = "5.5"

  s.dependency "BridgeeAiSDK", "~> 1.1"

  install_modules_dependencies(s)
end
