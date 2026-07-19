package dev.glenker.app

import android.content.Context
import android.util.Log
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

/**
 * Manages the lildax (OpenCode) native subprocess.
 *
 * The lildax binary is a Bun-built ARM64 musl ELF bundled under the app's
 * `nativeLibraryDir` as `liblildax.so`. We CANNOT exec it directly because
 * Android 10+ blocks resolution of its INTERP path (/lib/ld-musl-aarch64.so.1).
 * Instead we launch it through the musl dynamic loader (`libc.musl-aarch64.so.1`)
 * and point it at the real binary. We also set `BUN_SELF_EXE` because Bun loses
 * its own exe path when started via an explicit ld.so (a known Bun bug).
 *
 * This class is plain/testable: command and env construction are isolated in
 * [buildCommand] / [buildEnv] so unit tests can assert on them without spawning a
 * real process.
 */
class AgentProcess(private val context: Context) {

    private var process: Process? = null
    private var startedPort: Int = DEFAULT_PORT

    fun start(port: Int): Boolean {
        if (isProcessAlive()) {
            return true
        }
        startedPort = port
        val nativeLibraryDir = context.applicationInfo.nativeLibraryDir
        prepareNativeLibs(nativeLibraryDir)
        val command = buildCommand(port, nativeLibraryDir)
        val env = buildEnv(nativeLibraryDir)

        return try {
            val pb = ProcessBuilder(command)
            // Merge env: keep inherited environment and add our musl/Bun vars.
            val environment = pb.environment()
            env.forEach { (k, v) -> environment[k] = v }
            pb.redirectErrorStream(false)
            process = pb.start()

            pipeToLogcat(process!!.inputStream, "stdout")
            pipeToLogcat(process!!.errorStream, "stderr")

            isProcessAlive()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start lildax process", e)
            false
        }
    }

    fun stop() {
        try {
            process?.destroy()
        } catch (e: Exception) {
            Log.e(TAG, "Error destroying process", e)
        } finally {
            process = null
        }
    }

    fun isRunning(): Boolean {
        if (!isProcessAlive()) {
            return false
        }
        return healthProbe(startedPort)
    }

    /** The port this instance was started on (0 if never started). */
    fun currentPort(): Int = startedPort

    /**
     * Polls [isRunning] (process alive + HTTP health probe) until the server
     * answers or [timeoutMs] elapses.
     */
    fun waitForReady(timeoutMs: Long): Boolean {
        val deadline = System.currentTimeMillis() + timeoutMs
        var interval = 100L
        while (System.currentTimeMillis() < deadline) {
            if (isRunning()) {
                return true
            }
            Thread.sleep(interval)
            // Back off gently up to ~500ms to avoid busy-spinning.
            interval = (interval * 2).coerceAtMost(500L)
        }
        return isRunning()
    }

    private fun isProcessAlive(): Boolean {
        val p = process ?: return false
        return try {
            p.exitValue()
            false
        } catch (e: IllegalThreadStateException) {
            // Still running.
            true
        }
    }

    /**
     * Quick HTTP probe. We treat ANY response from the socket (2xx, 404, etc.)
     * as "the server is up" — a refused connection means it is not.
     */
    private fun healthProbe(port: Int): Boolean {
        return try {
            val url = URL("http://127.0.0.1:$port/health")
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = HEALTH_TIMEOUT_MS
            conn.readTimeout = HEALTH_TIMEOUT_MS
            conn.requestMethod = "GET"
            try {
                conn.responseCode // any code => server answered
                true
            } catch (e: Exception) {
                // A response that throws on body but had a status still means up;
                // only a connection error (refused) should fall through to false.
                conn.responseCode >= 0
            } finally {
                conn.disconnect()
            }
        } catch (e: java.net.ConnectException) {
            false
        } catch (e: Exception) {
            // Any other error (e.g. socket opened but protocol hiccup) is
            // ambiguous; assume not-ready rather than flapping.
            false
        }
    }

    private fun pipeToLogcat(stream: java.io.InputStream, label: String) {
        Thread {
            try {
                val reader = BufferedReader(InputStreamReader(stream))
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    Log.i(TAG, "[$label] $line")
                }
            } catch (e: Exception) {
                // Stream closed on process exit is expected.
            }
        }.apply { name = "glenker-$label" }.start()
    }

    /** Builds the launch command. Isolate for unit testing. */
    private fun buildCommand(port: Int, nativeLibraryDir: String): List<String> {
        return listOf(
            "$nativeLibraryDir/$MUSL_LOADER",
            "$nativeLibraryDir/$LILDAX_BINARY",
            "serve",
            "--port", port.toString(),
            "--bind", "127.0.0.1"
        )
    }

    /** Builds the environment overrides. Isolate for unit testing. */
    private fun buildEnv(nativeLibraryDir: String): Map<String, String> {
        return mapOf(
            "LD_LIBRARY_PATH" to nativeLibraryDir,
            "BUN_SELF_EXE" to "$nativeLibraryDir/$LILDAX_BINARY"
        )
    }

    /**
     * AGP only packages `*.so` files from jniLibs into the APK, so the musl
     * auxiliary libraries (libc.musl-aarch64.so.1, ld-musl-aarch64.so.1,
     * libstdc++.so.6, libgcc_s.so.1) are bundled under `assets/nativelibs/` and
     * copied next to the system-extracted `liblildax.so` (nativeLibraryDir) at
     * runtime. Their exact filenames must be preserved because lildax's
     * DT_NEEDED entries reference them by those names.
     */
    private fun prepareNativeLibs(nativeLibraryDir: String) {
        val auxNames = listOf(
            "libc.musl-aarch64.so.1",
            "ld-musl-aarch64.so.1",
            "libstdc++.so.6",
            "libgcc_s.so.1"
        )
        try {
            val dir = java.io.File(nativeLibraryDir)
            if (!dir.exists() && !dir.mkdirs()) return
            for (name in auxNames) {
                val out = java.io.File(dir, name)
                if (out.exists()) continue
                context.assets.open("nativelibs/$name").use { input ->
                    out.outputStream().use { output -> input.copyTo(output) }
                }
                Log.i(TAG, "Staged aux lib: $name")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stage auxiliary native libs", e)
        }
    }

    companion object {
        private const val TAG = "GlenkerAgent"
        private const val LILDAX_BINARY = "liblildax.so"
        private const val MUSL_LOADER = "libc.musl-aarch64.so.1"
        private const val HEALTH_TIMEOUT_MS = 1000
        const val DEFAULT_PORT = 4096
    }
}
