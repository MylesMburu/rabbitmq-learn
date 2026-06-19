// 03-pub-sub/subscriber.js
// ─────────────────────────────────────────────────────────────────────────────
// Lesson 3: Pub/Sub — Subscriber
//
// Each subscriber creates a temporary, exclusive queue and binds it to the
// fanout exchange. When the subscriber disconnects, the queue is automatically
// deleted — there's no leftover data piling up for an offline subscriber.
//
// Start two or more instances of this script, THEN run the publisher.
// Every subscriber will receive every message independently.
// ─────────────────────────────────────────────────────────────────────────────

const amqp = require("amqplib");

const RABBITMQ_URL = "amqp://localhost";
const EXCHANGE_NAME = "app_logs";
const SUBSCRIBER_ID = Math.floor(Math.random() * 1000);

async function main() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // Declare the same exchange (idempotent — safe to call multiple times)
  await channel.assertExchange(EXCHANGE_NAME, "fanout", { durable: false });

  // Create a temporary, anonymous queue for this subscriber.
  //   exclusive: true  — only this connection can use it
  //   autoDelete: true — deleted when the subscriber disconnects
  // We don't give it a name; RabbitMQ generates a unique one (e.g. amq.gen-xxx).
  const { queue: queueName } = await channel.assertQueue("", {
    exclusive: true,
  });

  // Bind the queue to the exchange.
  // The third argument (routing key) is ignored by fanout exchanges.
  await channel.bindQueue(queueName, EXCHANGE_NAME, "");

  console.log(`[Subscriber ${SUBSCRIBER_ID}] Listening on temp queue "${queueName}"`);
  console.log(`[Subscriber ${SUBSCRIBER_ID}] Waiting for broadcasts. Ctrl+C to exit.\n`);

  channel.consume(
    queueName,
    (message) => {
      const event = message.content.toString();
      console.log(`[Subscriber ${SUBSCRIBER_ID}] Received: "${event}"`);
    },
    { noAck: true }
  );
}

main().catch(console.error);
