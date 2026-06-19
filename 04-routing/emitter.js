// 04-routing/emitter.js
// ─────────────────────────────────────────────────────────────────────────────
// Lesson 4: Routing — Emitter
//
// A "direct" exchange routes messages to queues based on a routing key.
// Unlike fanout, each subscriber only gets messages for the keys they care about.
//
// Example use case: log levels.
//   - A "critical alerts" receiver only binds to "error"
//   - A "full audit log" receiver binds to "info", "warning", and "error"
// ─────────────────────────────────────────────────────────────────────────────

const amqp = require("amqplib");

const RABBITMQ_URL = "amqp://localhost";
const EXCHANGE_NAME = "direct_logs";

// Simulate a stream of log messages with different severities
const LOG_STREAM = [
  { level: "info",    message: "Server started on port 3000" },
  { level: "info",    message: "Database connection established" },
  { level: "warning", message: "Memory usage at 78%" },
  { level: "info",    message: "Request: GET /api/users 200 OK" },
  { level: "error",   message: "Unhandled exception in /api/orders" },
  { level: "warning", message: "Slow query detected: 3200ms" },
  { level: "info",    message: "Cache invalidated" },
  { level: "error",   message: "Payment gateway timeout" },
  { level: "info",    message: "Scheduled job completed" },
  { level: "error",   message: "Disk space below 10%" },
];

async function main() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // "direct" exchange routes messages to queues whose binding key matches
  // the routing key used when publishing.
  await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: false });

  for (const log of LOG_STREAM) {
    const body = Buffer.from(log.message);

    // The routing key (log.level) determines which queues receive this message.
    channel.publish(EXCHANGE_NAME, log.level, body);

    const emoji = { info: "ℹ️", warning: "⚠️", error: "🔴" }[log.level] || "•";
    console.log(`[x] [${log.level.toUpperCase()}] ${emoji} ${log.message}`);

    await new Promise((r) => setTimeout(r, 300));
  }

  await channel.close();
  await connection.close();
}

main().catch(console.error);
