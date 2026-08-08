// mobile-ai-toolkit — an OpenSLM project. https://github.com/openslm-ai
package com.openslm.mobileaitoolkit

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers the TurboModule with React Native.
 *
 * This class did not exist. Autolinking needs a ReactPackage to instantiate,
 * so without it the module was never registered on Android no matter how the
 * rest of the build was configured — and because the library was also never
 * compiled by CI, nothing said so. The first Gradle run that could have caught
 * it built the host app happily and simply never included this module.
 */
class AIToolkitPackage : BaseReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
        if (name == AIToolkitTurboModule.NAME) AIToolkitTurboModule(reactContext) else null

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
        mapOf(
            AIToolkitTurboModule.NAME to ReactModuleInfo(
                AIToolkitTurboModule.NAME,
                AIToolkitTurboModule.NAME,
                false, // canOverrideExistingModule
                false, // needsEagerInit
                false, // isCxxModule
                true   // isTurboModule
            )
        )
    }
}
