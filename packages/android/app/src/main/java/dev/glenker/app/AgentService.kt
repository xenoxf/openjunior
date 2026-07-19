package dev.glenker.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log

/**
 * Foreground service that owns the parallel lildax agent team lifecycle.
 *
 * A foreground service is required so the OS does not kill the long-running
 * agent processes under background memory pressure. The processes themselves
 * are managed by [AgentManager], which launches agents concurrently (a "team").
 */
class AgentService : Service() {

    private lateinit var agentManager: AgentManager

    override fun onCreate() {
        super.onCreate()
        agentManager = AgentManager(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())

        when (intent?.action) {
            ACTION_START_TEAM -> {
                val specs = intent.getSerializableExtra(EXTRA_TEAM) as? ArrayList<Pair<String, Int?>>
                specs?.let { agentManager.startTeam(it) }
            }
            ACTION_START_AGENT -> {
                val id = intent.getStringExtra(EXTRA_AGENT_ID) ?: "agent"
                val port = intent.getIntExtra(EXTRA_PORT, 0).let { if (it == 0) null else it }
                agentManager.startAgent(id, port)
            }
            ACTION_STOP_AGENT -> {
                intent.getStringExtra(EXTRA_AGENT_ID)?.let { agentManager.stopAgent(it) }
            }
            ACTION_STOP_ALL -> agentManager.stopAll()
        }

        return START_STICKY
    }

    fun manager(): AgentManager = agentManager

    @Suppress("DEPRECATION")
    override fun onDestroy() {
        agentManager.stopAll()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Glenker Agent",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps the local AI agent running"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    @Suppress("DEPRECATION")
    private fun buildNotification(): Notification {
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }
        return builder
            .setContentTitle("Glenker Agent")
            .setContentText("Local AI agent team is running")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .build()
    }

    companion object {
        private const val TAG = "GlenkerAgent"
        const val CHANNEL_ID = "glenker_agent"
        const val NOTIFICATION_ID = 1
        const val EXTRA_AGENT_ID = "agentId"
        const val EXTRA_PORT = "port"
        const val EXTRA_TEAM = "team"
        const val ACTION_START_AGENT = "dev.glenker.app.action.START_AGENT"
        const val ACTION_START_TEAM = "dev.glenker.app.action.START_TEAM"
        const val ACTION_STOP_AGENT = "dev.glenker.app.action.STOP_AGENT"
        const val ACTION_STOP_ALL = "dev.glenker.app.action.STOP_ALL"
    }
}
