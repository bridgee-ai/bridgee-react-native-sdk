require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RNBridgeeAiSDK"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  s.platforms    = { :ios => "14.0" }
  s.source       = { :git => package["repository"]["url"], :tag => "#{s.version}" }
  
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  
  # Configuração Swift
  s.swift_version = "5.5"
  
  s.dependency "BridgeeAiSDK", '= 1.1.1'
  s.dependency "FirebaseAnalytics"
  s.dependency "Firebase/Core"
  
  install_modules_dependencies(s)
end