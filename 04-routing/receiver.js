// 04-routing/receiver.js
// ─────────────────────────────────────────────────────────────────────────────
// Lesson 4: Routing — Receiver
//
// Pass the log levels you want to receive as command-line arguments:
//
//   node receiver.js error
//   node receiver.js info warning
//   node receiver.js info warning error
//
// Each receiver creates its own queue and binds only to the specified keys.
// ─────────────────────────────────────────────────────────────────────────────

const amqp = require("amqplib");

const RABBITMQ_URL = "amqp://localhost";
const EXCHANGE_NAME = "direct_logs";
const VALID_LEVELS = ["info", "warning", "error"];

// Read routing keys from command-line arguments (default: all levels)
const requestedLevels = process.argv.slice(2);
const bindingKeys =
  requestedLevels.length > 0
    ? requestedLevels.filter((k) => VALID_LEVELS.includes(k))
    : VALID_LEVELS;

if (bindingKeys.length === 0) {
  console.error(`Usage: node receiver.js [${VALID_LEVELS.join("|")}] ...`);
  process.exit(1);
}

const RECEIVER_ID = Math.floor(Math.random() * 1000);

async function main() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: false });

  // Temporary exclusive queue for this receiver
  const { queue: queueName } = await channel.assertQueue("", { exclusive: true });

  // Bind the queue to the exchange for EACH requested routing key.
  // A queue can have multiple bindings — it receives messages for any of them.
  for (const key of bindingKeys) {
    await channel.bindQueue(queueName, EXCHANGE_NAME, key);
  }

  console.log(`[Receiver ${RECEIVER_ID}] Subscribed to: [${bindingKeys.join(", ")}]`);
  console.log(`[Receiver ${RECEIVER_ID}] Waiting for logs. Ctrl+C to exit.\n`);

  channel.consume(
    queueName,
    (message) => {
      // The routing key that delivered this message is in message.fields
      const level = message.fields.routingKey;
      const text = message.content.toString();
      const emoji = { info: "ℹ️", warning: "⚠️", error: "🔴" }[level] || "•";

      console.log(`[Receiver ${RECEIVER_ID}] [${level.toUpperCase()}] ${emoji} ${text}`);
    },
    { noAck: true }
  );
}

main().catch(console.error);
