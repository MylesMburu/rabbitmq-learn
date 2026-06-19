// 02-work-queue/task-sender.js
// ─────────────────────────────────────────────────────────────────────────────
// Lesson 2: Work Queue — Task Sender
//
// Simulates sending 10 tasks of varying "difficulty" (dots = seconds of work).
// Multiple workers will share these tasks round-robin.
// ─────────────────────────────────────────────────────────────────────────────

const amqp = require("amqplib");

const RABBITMQ_URL = "amqp://localhost";
const QUEUE_NAME = "tasks";

// Simulate tasks with different workloads
const TASKS = [
  "Email report.",         // 1 dot  = 1 second of "work"
  "Resize image..",        // 2 dots = 2 seconds
  "Transcode video.......", // 7 dots = 7 seconds
  "Send newsletter.",
  "Generate PDF..",
  "Sync database....",
  "Run backup......",
  "Build report..",
  "Archive logs.",
  "Ping health check.",
];

async function main() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // durable: true — the queue survives a RabbitMQ restart
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  for (const task of TASKS) {
    channel.sendToQueue(
      QUEUE_NAME,
      Buffer.from(task),
      {
        // persistent: true — the message itself is saved to disk
        // (without this, messages in a durable queue can still be lost
        //  if RabbitMQ crashes before they're consumed)
        persistent: true,
      }
    );
    console.log(`[x] Sent task: "${task}"`);
  }

  console.log("\nAll tasks sent. Workers will pick them up round-robin.");

  setTimeout(async () => {
    await channel.close();
    await connection.close();
  }, 500);
}

main().catch(console.error);
