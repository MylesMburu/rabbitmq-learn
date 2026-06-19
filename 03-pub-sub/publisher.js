// 03-pub-sub/publisher.js
// ─────────────────────────────────────────────────────────────────────────────
// Lesson 3: Pub/Sub — Publisher
//
// Instead of sending to a named queue directly, we publish to a "fanout"
// exchange. The exchange broadcasts the message to every queue bound to it.
// Each subscriber has its own private queue, so every subscriber gets a copy.
//
// This is the classic "broadcast" or "event bus" pattern.
// ─────────────────────────────────────────────────────────────────────────────

const amqp = require("amqplib");

const RABBITMQ_URL = "amqp://localhost";
const EXCHANGE_NAME = "app_logs"; // the exchange we publish to

const LOG_EVENTS = [
  "User signed up: alice@example.com",
  "Order placed: #4521 — $89.99",
  "Payment confirmed: #4521",
  "Email sent: welcome to alice@example.com",
  "Product viewed: SKU-771 by alice",
];

async function main() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // Declare a fanout exchange.
  // "fanout" = send to ALL bound queues, ignoring any routing key.
  // durable: false — exchange is lost on RabbitMQ restart (fine for demos)
  await channel.assertExchange(EXCHANGE_NAME, "fanout", { durable: false });

  for (const event of LOG_EVENTS) {
    // publish() sends to an exchange, not a queue directly.
    // The second argument (routing key) is ignored by fanout exchanges.
    channel.publish(EXCHANGE_NAME, "", Buffer.from(event));
    console.log(`[x] Published: "${event}"`);

    // Small delay so you can watch the output
    await new Promise((r) => setTimeout(r, 400));
  }

  await channel.close();
  await connection.close();
}

main().catch(console.error);
