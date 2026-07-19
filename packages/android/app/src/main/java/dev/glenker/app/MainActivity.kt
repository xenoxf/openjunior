package dev.glenker.app

import com.getcapacitor.BridgeActivity

/**
 * Capacitor 8 MainActivity.
 *
 * Registers [GlenkerPlugin] explicitly for safety (Capacitor 8 auto-discovers
 * annotated plugins, but explicit registration guarantees availability).
 *
 * NOTE: Capacitor 8 also auto-discovers plugins annotated with
 * @CapacitorPlugin via classpath scanning, so adding the plugin to
 * android/app/src/main/res/xml/config.xml is optional. If you prefer explicit
 * config registration, add inside <plugins>:
 *   <plugin name="Glenker" value="dev.glenker.app.GlenkerPlugin" />
 */
class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        registerPlugin(GlenkerPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
