// 01-hello-world/producer.js
// ─────────────────────────────────────────────────────────────────────────────
// Lesson 1: Hello World — Producer
//
// This script connects to RabbitMQ, declares a queue called "hello",
// sends one message, then disconnects.
// ─────────────────────────────────────────────────────────────────────────────

const amqp = require("amqplib");

const RABBITMQ_URL = "amqp://localhost";
const QUEUE_NAME = "hello";

async function main() {
  // 1. Create a connection to the RabbitMQ server
  const connection = await amqp.connect(RABBITMQ_URL);

  // 2. Open a "channel" — most RabbitMQ operations happen on a channel
  const channel = await connection.createChannel();

  // 3. Declare the queue
  //    { durable: false } means the queue is lost if RabbitMQ restarts
  //    (fine for learning; see Lesson 2 for durable queues)
  await channel.assertQueue(QUEUE_NAME, { durable: false });

  // 4. Send a message
  //    sendToQueue() accepts a Buffer, so we convert the string first
  const message = "Hello, RabbitMQ! 👋";
  channel.sendToQueue(QUEUE_NAME, Buffer.from(message));

  console.log(`[x] Sent: "${message}"`);

  // 5. Give the channel time to flush, then close the connection
  setTimeout(async () => {
    await channel.close();
    await connection.close();
  }, 500);
}

main().catch(console.error);
