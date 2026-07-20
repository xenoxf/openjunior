package dev.glenker.app

import android.content.Intent
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Capacitor 8 plugin bridging the JS/WebView layer to the native agent service.
 *
 * The plugin starts [AgentService] (a foreground service) via Intent; the
 * service owns the [AgentManager], which launches agents concurrently. This
 * keeps the WebView free of the native subprocesses and lets the agent team
 * survive WebView reloads.
 *
 * Multi-agent support:
 *  - [startAgent] spawns a single agent (auto port or explicit).
 *  - [startTeam] spawns many agents in parallel (a "team").
 *  - [stopAgent] / [stopAll] tear them down individually or collectively.
 *  - [listAgents] / [agentStatus] report live state.
 */
@CapacitorPlugin(name = "Glenker")
class GlenkerPlugin : Plugin() {

    private fun manager(): AgentManager? {
        val service = context.getSystemService(AgentService::class.java)
        return service?.manager()
    }

    @PluginMethod
    fun startAgent(call: PluginCall) {
        val id = call.getString("id") ?: "agent-${System.currentTimeMillis()}"
        val port = call.getInt("port")
        val intent = Intent(context, AgentService::class.java).apply {
            action = AgentService.ACTION_START_AGENT
            putExtra(AgentService.EXTRA_AGENT_ID, id)
            port?.let { putExtra(AgentService.EXTRA_PORT, it) }
        }
        startServiceSafely(intent, call) ?: run {
            // If the service is already up, drive the manager directly.
            val started = manager()?.startAgent(id, port)?.started ?: false
            if (started) {
                val result = JSObject()
                result.put("id", id)
                result.put("running", true)
                call.resolve(result)
            } else {
                call.reject("Failed to start agent '$id'")
            }
        }
    }

    @PluginMethod
    fun startTeam(call: PluginCall) {
        val agents = call.getArray("agents") ?: run {
            call.reject("'agents' array is required")
            return
        }
        val specs = ArrayList<Pair<String, Int?>>()
        for (i in 0 until agents.length()) {
            val item = agents.getJSONObject(i)
            val aid = item.getString("id") ?: "agent-$i"
            val aport = if (item.has("port")) item.getInt("port") else null
            specs.add(aid to aport)
        }
        val intent = Intent(context, AgentService::class.java).apply {
            action = AgentService.ACTION_START_TEAM
            putExtra(AgentService.EXTRA_TEAM, specs)
        }
        startServiceSafely(intent, call) ?: run {
            val handles = manager()?.startTeam(specs)
            val agentsOut = JSArray()
            val running = handles?.isNotEmpty() ?: false
            handles?.forEach { h ->
                val o = JSObject()
                o.put("id", h.id)
                o.put("port", h.port)
                o.put("running", h.started)
                agentsOut.put(o)
            }
            val result = JSObject()
            result.put("count", specs.size)
            result.put("running", running)
            result.put("agents", agentsOut)
            call.resolve(result)
        }
    }

    @PluginMethod
    fun stopAgent(call: PluginCall) {
        val id = call.getString("id") ?: run {
            call.reject("'id' is required")
            return
        }
        val intent = Intent(context, AgentService::class.java).apply {
            action = AgentService.ACTION_STOP_AGENT
            putExtra(AgentService.EXTRA_AGENT_ID, id)
        }
        startServiceSafely(intent, call) ?: run {
            val stopped = manager()?.stopAgent(id) ?: false
            val result = JSObject()
            result.put("stopped", stopped)
            call.resolve(result)
        }
    }

    @PluginMethod
    fun stopAll(call: PluginCall) {
        val intent = Intent(context, AgentService::class.java).apply {
            action = AgentService.ACTION_STOP_ALL
        }
        try {
            context.startService(intent)
        } catch (_: Exception) {
        }
        manager()?.stopAll()
        val result = JSObject()
        result.put("running", false)
        call.resolve(result)
    }

    @PluginMethod
    fun agentStatus(call: PluginCall) {
        val id = call.getString("id")
        val running = if (id != null) manager()?.isRunning(id) ?: false else false
        val result = JSObject()
        result.put("running", running)
        if (id != null) result.put("id", id)
        call.resolve(result)
    }

    @PluginMethod
    fun listAgents(call: PluginCall) {
        val summaries = manager()?.listAgents() ?: emptyList()
        val arr = JSArray()
        for (s in summaries) {
            val o = JSObject()
            o.put("id", s.id)
            o.put("port", s.port)
            o.put("running", s.running)
            arr.put(o)
        }
        val result = JSObject()
        result.put("agents", arr)
        call.resolve(result)
    }

    /**
     * Starts the foreground service if not running; resolves [call] with the
     * port info and returns null. If the service is already running (so the
     * Intent is a no-op), returns the [call] unconsumed so the caller can
     * drive the manager directly.
     */
    private fun startServiceSafely(intent: Intent, call: PluginCall): PluginCall? {
        return try {
            context.startForegroundService(intent)
            // First-launch path: the service resolves before the manager is up,
            // so per-agent ports aren't available yet. JS must follow up with
            // listAgents() to get the agents array with ports.
            val result = JSObject()
            result.put("running", true)
            call.resolve(result)
            null
        } catch (e: Exception) {
            call.reject("Failed to start agent service", e)
            null
        }
    }
}
