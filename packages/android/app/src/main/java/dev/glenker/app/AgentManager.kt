package dev.glenker.app

import android.content.Context
import android.util.Log
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Owns the lifecycle of multiple parallel lildax agent processes ("a team").
 *
 * Each agent is an independent lildax instance bound to its own loopback port.
 * Agents are launched concurrently via a fixed thread pool so a "team" of N
 * agents starts in roughly the time a single agent takes. All operations are
 * thread-safe: the agent map is a [ConcurrentHashMap] and each [AgentProcess]
 * owns its own OS process.
 *
 * Ports are allocated round-robin starting at [BASE_PORT] and skipping any
 * port already used by a live agent, so concurrent teams never collide.
 */
class AgentManager(private val context: Context) {

    private val agents = ConcurrentHashMap<String, AgentProcess>()
    private val portLock = Any()
    private val executor = Executors.newCachedThreadPool { r ->
        Thread(r, "glenker-agent-pool").also { it.isDaemon = true }
    }

    /** Starts a single agent on a given or auto-allocated port. */
    fun startAgent(id: String, port: Int? = null): AgentHandle {
        val resolvedPort = port ?: allocatePort()
        val process = AgentProcess(context)
        agents[id] = process
        val started = process.start(resolvedPort)
        Log.i(TAG, "Agent '$id' start on port $resolvedPort -> $started")
        return AgentHandle(id, resolvedPort, started)
    }

    /**
     * Launches several agents in parallel. Each entry in [specs] is
     * `(agentId, optionalPort)`. Returns a handle per agent immediately after
     * the parallel launch completes (the processes keep booting in the
     * background; use [waitReady] to await readiness).
     */
    fun startTeam(specs: List<Pair<String, Int?>>): List<AgentHandle> {
        val futures = specs.map { (id, port) ->
            executor.submit<List<Any?>> {
                val resolvedPort = port ?: allocatePort()
                val process = AgentProcess(context)
                agents[id] = process
                val started = process.start(resolvedPort)
                listOf(id, resolvedPort, started)
            }
        }
        return futures.map { f ->
            val (id, resolvedPort, started) = f.get()
            Log.i(TAG, "Team agent '$id' start on port $resolvedPort -> $started")
            AgentHandle(id as String, resolvedPort as Int, started as Boolean)
        }
    }

    fun stopAgent(id: String): Boolean {
        val process = agents.remove(id) ?: return false
        process.stop()
        Log.i(TAG, "Agent '$id' stopped")
        return true
    }

    fun stopAll() {
        agents.keys.toList().forEach { stopAgent(it) }
        executor.shutdown()
        try {
            executor.awaitTermination(5, TimeUnit.SECONDS)
        } catch (e: InterruptedException) {
            Log.w(TAG, "Interrupted while awaiting agent pool shutdown")
        }
    }

    fun isRunning(id: String): Boolean = agents[id]?.isRunning() ?: false

    fun waitReady(id: String, timeoutMs: Long): Boolean = agents[id]?.waitForReady(timeoutMs) ?: false

    fun listAgents(): List<AgentSummary> {
        return agents.map { (id, p) ->
            AgentSummary(id, p.currentPort(), p.isRunning())
        }
    }

    private fun allocatePort(): Int {
        synchronized(portLock) {
            var candidate = BASE_PORT
            val used = agents.values.map { it.currentPort() }.toSet()
            while (used.contains(candidate)) {
                candidate += 1
            }
            return candidate
        }
    }

    data class AgentHandle(val id: String, val port: Int, val started: Boolean)
    data class AgentSummary(val id: String, val port: Int, val running: Boolean)

    companion object {
        private const val TAG = "GlenkerAgent"
        const val BASE_PORT = 4096
    }
}
