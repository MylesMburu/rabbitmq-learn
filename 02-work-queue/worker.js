// 02-work-queue/worker.js
// ─────────────────────────────────────────────────────────────────────────────
// Lesson 2: Work Queue — Worker
//
// Start two or more instances of this script. RabbitMQ will distribute tasks
// between them. Each "." in a task name represents one second of work.
//
// Key concepts demonstrated:
//   - Manual acknowledgement (ack)  — RabbitMQ only removes a message after
//     the worker confirms it finished. If the worker crashes, the message is
//     re-queued and another worker picks it up.
//   - prefetch(1) — a worker won't receive a new task until it has acked
//     the previous one. Without this, RabbitMQ sends tasks round-robin even
//     if one worker is already swamped (unfair dispatch).
// ─────────────────────────────────────────────────────────────────────────────

const amqp = require("amqplib");

const RABBITMQ_URL = "amqp://localhost";
const QUEUE_NAME = "tasks";
const WORKER_ID = Math.floor(Math.random() * 1000); // random ID to tell workers apart

// Simulate work: one second per dot in the task name
function doWork(task) {
  const seconds = (task.match(/\./g) || []).length || 1;
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function main() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  // prefetch(1) = "send me only one task at a time"
  // RabbitMQ won't dispatch the next task until this worker sends an ack.
  channel.prefetch(1);

  console.log(`[Worker ${WORKER_ID}] Ready. Waiting for tasks...`);

  channel.consume(
    QUEUE_NAME,
    async (message) => {
      const task = message.content.toString();
      const dots = (task.match(/\./g) || []).length || 1;

      console.log(`[Worker ${WORKER_ID}] Received: "${task}" (${dots}s of work)`);

      await doWork(task);

      console.log(`[Worker ${WORKER_ID}] Done:     "${task}" ✔`);

      // ACK — tell RabbitMQ this message was processed successfully.
      // If we crash before this line, RabbitMQ re-delivers the message
      // to another worker. No task is lost!
      channel.ack(message);
    },
    { noAck: false } // false = we handle acks manually
  );
}

main().catch(console.error);
