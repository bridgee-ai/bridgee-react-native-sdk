require 'xcodeproj'

root = File.expand_path(__dir__)
project = Xcodeproj::Project.new(File.join(root, 'BridgeeSdkCompile.xcodeproj'))
target = project.new_target(:application, 'BridgeeSdkCompile', :ios, '14.0')
source = project.main_group.new_file(File.join(root, 'main.m'))
target.source_build_phase.add_file_reference(source)
swift_source = project.main_group.new_file(File.join(root, 'SwiftRuntime.swift'))
target.source_build_phase.add_file_reference(swift_source)
target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'ai.bridgee.internal.compile'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'] = 'YES'
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.save_as(project.path, 'BridgeeSdkCompile', true)
