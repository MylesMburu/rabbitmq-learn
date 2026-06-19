// 01-hello-world/consumer.js
// ─────────────────────────────────────────────────────────────────────────────
// Lesson 1: Hello World — Consumer
//
// This script connects to RabbitMQ, declares the same "hello" queue,
// and waits for messages. It stays running until you press Ctrl+C.
//
// NOTE: Always declare the queue in both producer AND consumer.
//       You never know which one will start first, and the queue must
//       exist before messages can be sent to it.
// ─────────────────────────────────────────────────────────────────────────────

const amqp = require("amqplib");

const RABBITMQ_URL = "amqp://localhost";
const QUEUE_NAME = "hello";

async function main() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // Declare the queue (same settings as the producer)
  await channel.assertQueue(QUEUE_NAME, { durable: false });

  console.log(`[*] Waiting for messages on "${QUEUE_NAME}". Press Ctrl+C to exit.\n`);

  // consume() registers a callback that fires every time a message arrives.
  // { noAck: true } means we don't send an acknowledgement back.
  // (In Lesson 2 we'll see why acknowledgements matter.)
  channel.consume(
    QUEUE_NAME,
    (message) => {
      // message.content is a Buffer — convert it back to a string
      const text = message.content.toString();
      console.log(`[x] Received: "${text}"`);
    },
    { noAck: true }
  );
}

main().catch(console.error);
