import { Concept } from '../types';

export const AWS_SERVICES_PART1: Concept[] = [
  {
    id: 'aws-sqs',
    cat: 'cloud',
    color: '#4db0c9',
    icon: '📨',
    title: 'Amazon SQS',
    tag: 'A managed message queue that decouples producers from consumers',

    overview:
      'Amazon SQS (Simple Queue Service) is a fully managed message queue service that enables you to decouple and scale microservices, distributed systems, and serverless applications. It eliminates the operational burden of managing message broker infrastructure — no servers to provision, patch, or scale. SQS guarantees that every message is delivered at least once and that a single consumer processes it at a time, using the visibility timeout mechanism.\n\nSQS offers two queue types suited for different workloads. Standard queues provide at-least-once delivery with best-effort ordering: messages may occasionally be delivered out of order or more than once, but they support nearly unlimited throughput — making them ideal for high-volume, order-insensitive workloads. FIFO (First-In-First-Out) queues provide exactly-once processing and strict message ordering within a message group, with a throughput limit of 3,000 messages per second using batching (300 msg/s without). FIFO queues use a deduplication ID to prevent duplicate messages from being inserted within a 5-minute window.\n\nMessage size is capped at 256 KB. For larger payloads (images, documents, JSON blobs), use the SQS Extended Client Library which stores the message body in S3 and sends only a pointer through SQS. SQS integrates natively with Lambda (event source mapping for automatic polling), SNS (fan-out pattern), and Step Functions.',

    components: [
      {
        name: 'Queue (Standard vs FIFO)',
        icon: '🗂️',
        role: 'The core message store — buffers messages between producer and consumer',
        detail:
          'Standard Queue: at-least-once delivery (messages may be delivered more than once), best-effort ordering (may arrive out of sequence), virtually unlimited throughput, messages replicated across multiple AZs for durability. Best for email notifications, log ingestion, batch job dispatch where order does not matter and duplicates can be tolerated. FIFO Queue: exactly-once processing within a 5-minute deduplication window (identified by MessageDeduplicationId), strict ordering within a MessageGroupId (think of it as a sub-queue partition), throughput capped at 3,000 msg/s with batching or 300 msg/s without. Use for payment processing, order management, inventory updates. Message size: up to 256 KB. For larger payloads, use the SQS Extended Client Library: body stored in S3, SQS message carries the S3 reference.',
      },
      {
        name: 'Visibility Timeout',
        icon: '⏱️',
        role: 'Prevents two consumers from processing the same message simultaneously',
        detail:
          'When a consumer calls ReceiveMessage, SQS makes the message invisible to all other consumers for the visibility timeout duration (default 30 seconds, configurable 0 seconds to 12 hours). If the consumer successfully processes the message and calls DeleteMessage, the message is permanently removed. If the consumer crashes, times out, or fails without calling DeleteMessage, the message becomes visible again after the timeout expires and another consumer can pick it up. The critical rule: visibility timeout must be greater than the maximum expected processing time. For variable processing times, consumers should call ChangeMessageVisibility to extend the timeout dynamically before it expires. Setting the timeout too short causes duplicate processing; too long delays retries after genuine failures.',
      },
      {
        name: 'Dead Letter Queue (DLQ)',
        icon: '💀',
        role: 'Captures messages that repeatedly fail to be processed, preventing infinite retry loops',
        detail:
          'A DLQ is a separate SQS queue that receives messages after they have exceeded the maxReceiveCount threshold (configurable from 1 to 1,000 — recommended: 3 to 5). Each time a message becomes visible and is received by a consumer, SQS increments its receive count. When the count exceeds maxReceiveCount, SQS moves the message to the configured DLQ. DLQ messages retain original metadata and body for debugging. DLQ Redrive (re-drive): once the bug is fixed, you can replay DLQ messages back to the source queue via the console or API. Best practices: always configure a DLQ; set a CloudWatch alarm on ApproximateNumberOfMessagesVisible in the DLQ; DLQ must be the same type as the source queue (Standard DLQ for Standard queue, FIFO DLQ for FIFO queue).',
      },
      {
        name: 'Long Polling',
        icon: '🔄',
        role: 'Reduces empty responses and API costs by waiting for messages before returning',
        detail:
          'Short polling (default, WaitTimeSeconds=0): SQS queries a subset of its distributed servers and returns immediately, even if the queue is empty. This leads to many empty ReceiveMessage responses and higher API costs. Long polling (WaitTimeSeconds=1–20): SQS queries all servers and waits up to the specified duration for at least one message to arrive before responding. This eliminates ~99% of empty responses, reducing cost and CPU spin on the consumer. Long polling is almost always preferable. Enable at the queue level (ReceiveMessageWaitTimeSeconds attribute) or per-request. When using Lambda triggers for SQS, AWS manages polling automatically with long polling.',
      },
    ],

    howItWorks:
      'A producer (web server, Lambda, microservice) calls SendMessage (or SendMessageBatch for up to 10 messages at once) to place a message into the SQS queue. SQS stores the message redundantly across multiple AZs within the region, acknowledging receipt to the producer. The message sits in the queue until a consumer is ready. SQS does not push messages — consumers must poll using ReceiveMessage. A consumer calls ReceiveMessage, specifying how many messages to retrieve (1–10) and the WaitTimeSeconds for long polling. SQS returns the messages along with a ReceiptHandle — a unique token valid only for the current visibility timeout window.\n\nUpon receiving a message, SQS marks it as invisible (in-flight) for the visibility timeout duration. The consumer processes the message — writes to a database, calls an API, sends a notification. If processing succeeds, the consumer calls DeleteMessage with the ReceiptHandle to permanently remove the message. If the consumer crashes or fails to call DeleteMessage before the visibility timeout expires, SQS automatically makes the message visible again, and it will be delivered to the next available consumer. This is how SQS guarantees at-least-once delivery. For long processing tasks, the consumer should call ChangeMessageVisibility periodically to extend the timeout and prevent premature re-delivery.\n\nFor FIFO queues, the flow is the same but with additional guarantees. Each message must include a MessageGroupId (used to enforce ordering within a group — SQS processes one group at a time) and optionally a MessageDeduplicationId (SQS rejects duplicate messages with the same ID within a 5-minute window). If MessageDeduplicationId is not supplied, you must enable content-based deduplication, where SQS computes a SHA-256 hash of the message body. Only one consumer processes messages in a given MessageGroupId at a time — if you need parallelism, use multiple message group IDs.\n\nBatch operations are critical for efficiency. SendMessageBatch sends up to 10 messages in one API call, reducing cost by 10×. ReceiveMessage retrieves up to 10 messages per call. DeleteMessageBatch removes up to 10 at once. AWS Lambda SQS triggers automatically batch messages (configurable batch size and batch window), invoke your function with a batch, and only delete successfully processed messages (partial batch response support allows failing specific messages while succeeding others).',

    decision: {
      choose: [
        'Standard queue for high-throughput, order-insensitive workloads like log ingestion, email notifications, background job dispatch',
        'FIFO queue for payment processing, order management, inventory updates where exactly-once and strict ordering are required',
        'SQS over SNS for point-to-point messaging where one consumer processes each message',
        'SQS + SNS fan-out pattern when a single event must be delivered to multiple independent SQS queues (e.g., order placed → billing queue + fulfillment queue + analytics queue)',
        'SQS as a Lambda event source for automatic, scalable, cost-efficient worker patterns with no polling infrastructure to manage',
        'SQS with visibility timeout for at-least-once delivery guarantees with automatic retry on failure',
      ],
      avoid: [
        'FIFO queues for throughput exceeding 3,000 msg/s with batching — use Kinesis or Kafka instead',
        'SQS for real-time sub-millisecond messaging — use Redis Pub/Sub, Kafka, or WebSockets',
        'Relying on Standard queue message ordering — it is best-effort only and messages will arrive out of order',
        'SQS without a DLQ — poison pill messages will loop forever, consuming compute and blocking processing',
        'Setting visibility timeout equal to or less than processing time — causes duplicate processing and idempotency issues',
        'SQS for request-reply patterns — it is a one-way fire-and-forget queue; use SQS with a correlation ID + reply queue for request-reply, or use API Gateway + Lambda directly',
      ],
      vs: [
        {
          name: 'SQS vs Apache Kafka',
          when:
            'Use Kafka when you need message replay (consumers re-read historical messages), event streaming with high retention (days to forever), multiple independent consumer groups each reading at their own offset, or sub-10ms latency at extreme scale. Kafka retains all messages for a configurable period regardless of consumption. Use SQS when you want zero-ops managed infrastructure, simple at-least-once or exactly-once point-to-point delivery, and automatic scaling without managing brokers, partitions, or consumer group offsets.',
        },
        {
          name: 'SQS vs RabbitMQ',
          when:
            'Use RabbitMQ when you need complex routing topologies (topic exchanges, header-based routing, direct exchanges), fine-grained per-message acknowledgements, or you are running on-premises/hybrid cloud. RabbitMQ offers rich AMQP protocol support. Use SQS when you want a fully managed AWS-native service with no broker infrastructure to run, patch, or scale, tight integration with IAM/Lambda/SNS, and simpler operational overhead.',
        },
      ],
    },

    failures: [
      {
        name: 'Visibility timeout too short — duplicate message processing',
        cause:
          'The visibility timeout is set shorter than the actual processing time. The consumer is still processing the message when the timeout expires.',
        symptom:
          'The same message appears to be processed multiple times. Database records are duplicated. Downstream APIs receive the same request twice. ApproximateNumberOfMessagesNotVisible drops suddenly and the message reappears in the queue.',
        fix: 'Set the visibility timeout to at least 6× the average processing time. For variable durations, call ChangeMessageVisibility within the processing logic to extend the timeout before it expires. Implement idempotent consumers (use a unique message ID to check if already processed before acting). Monitor the ApproximateAgeOfOldestMessage metric to detect slow processing.',
        severity: 'high',
      },
      {
        name: 'DLQ not configured — poison pill message infinite loop',
        cause:
          'A message is malformed, references a deleted resource, or triggers a bug in the consumer. Without a DLQ, the message fails processing, times out, becomes visible again, and is retried indefinitely.',
        symptom:
          'Consumer Lambda or EC2 workers are continuously invoked with the same message. CloudWatch shows consistent invocation errors for a specific message ID. The queue depth does not decrease. Compute costs spike.',
        fix: 'Always configure a DLQ on every SQS queue. Set maxReceiveCount to 3–5 (enough retries for transient failures, not so many that a poison pill loops for hours). Set a CloudWatch alarm on DLQ ApproximateNumberOfMessagesVisible > 0. After fixing the bug, use DLQ Redrive to replay messages back to the source queue.',
        severity: 'critical',
      },
      {
        name: 'Consumer not deleting messages after processing',
        cause:
          'The consumer processes the message successfully but either forgets to call DeleteMessage, calls it with the wrong ReceiptHandle, or the ReceiptHandle has expired by the time DeleteMessage is called.',
        symptom:
          'Messages are processed multiple times. Queue depth never decreases even under normal load. ApproximateNumberOfMessagesNotVisible stays high. Side effects (emails sent, charges processed) repeat.',
        fix: 'Wrap delete in a finally block after confirmed successful processing. Only delete on success — failed processing should let the message become visible for retry. If using Lambda, AWS handles deletion automatically for successfully processed messages; use partial batch response (reportBatchItemFailures) to fail only specific messages. Never reuse ReceiptHandles across multiple receive calls.',
        severity: 'high',
      },
    ],

    a: {
      v: 'Postal Sorting Office',
      t: 'Think of SQS as a large postal sorting office between senders and mail carriers.',
      tx: 'A sender (producer) drops letters (messages) into the sorting office inbox. Mail carriers (consumers) come to the counter, pick up a batch of letters, and sign for them — this "signature" makes those letters invisible to other carriers (visibility timeout). If a carrier successfully delivers the letters, they mark them as delivered (DeleteMessage) and they are removed from the system. If a carrier is in an accident and never confirms delivery, the letters go back into the inbox after a timeout so another carrier can pick them up. Letters that no carrier can deliver (addressed to a demolished building) get sent to a special undeliverable mail room (DLQ) where postal workers investigate and fix the problem.',
      s: 'SQS buffers and protects messages between producers and consumers, ensuring every message is processed exactly as a postal office ensures every letter is delivered or investigated.',
    },

    te: {
      def: 'Amazon SQS is a fully managed distributed message queue service that stores messages in a highly available, durable buffer between producers and consumers. It decouples the sender from the receiver, ensuring messages are not lost if the consumer is temporarily unavailable, and scales automatically to handle any message volume.',
      types: [
        {
          n: 'Standard Queue',
          d: 'At-least-once delivery, best-effort ordering, near-unlimited throughput. Messages may arrive out of order or be delivered more than once. Consumers must be idempotent. Ideal for high-volume, order-insensitive workloads.',
        },
        {
          n: 'FIFO Queue',
          d: 'Exactly-once processing (within 5-minute dedup window), strict ordering within a MessageGroupId. Throughput: 3,000 msg/s with batching, 300 msg/s without. Required for payment processing, order sequencing, inventory management.',
        },
        {
          n: 'Dead Letter Queue (DLQ)',
          d: 'A standard or FIFO queue that captures messages exceeding the maxReceiveCount threshold. Used for debugging failed messages. Supports DLQ Redrive to replay messages after fixing the underlying bug.',
        },
        {
          n: 'Long Polling',
          d: 'Consumer waits up to 20 seconds for messages before returning an empty response. Eliminates ~99% of empty ReceiveMessage API calls, reducing cost and consumer CPU waste. Set WaitTimeSeconds=20 for maximum efficiency.',
        },
        {
          n: 'Batch Operations',
          d: 'SendMessageBatch, ReceiveMessage (up to 10), DeleteMessageBatch — process up to 10 messages per API call, reducing costs by up to 10× and improving throughput. Lambda SQS triggers use batching with configurable batch size and batch window.',
        },
      ],
      when:
        'Use SQS whenever you need to decouple a producer from a consumer to absorb traffic spikes, enable independent scaling, or tolerate consumer downtime without losing messages. Classic patterns: web tier enqueues jobs for async worker tier; microservices communicate without direct coupling; Lambda workers process background tasks; event-driven pipelines buffer between stages.',
      trade:
        'SQS Standard delivers at-least-once — consumers must be idempotent (safe to process the same message twice). FIFO queues solve ordering and exactly-once but cap throughput at 3,000 msg/s with batching. SQS has no built-in message replay (unlike Kafka) — once deleted, messages are gone. Polling model means consumers must actively pull (though Lambda automates this). Max message size is 256 KB. SQS is not suitable for real-time sub-millisecond latency.',
      code: `// Node.js — AWS SDK v3
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  ChangeMessageVisibilityCommand,
} from '@aws-sdk/client-sqs';

const client = new SQSClient({ region: 'us-east-1' });
const QUEUE_URL = process.env.SQS_QUEUE_URL!;
const DLQ_URL = process.env.SQS_DLQ_URL!;

// --- Producer: Send a message ---
async function sendOrder(order: { id: string; amount: number }) {
  await client.send(new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(order),
    // For FIFO queues, add:
    // MessageGroupId: 'orders',
    // MessageDeduplicationId: order.id,
  }));
  console.log('Order enqueued:', order.id);
}

// --- Consumer: Receive, process, delete ---
async function processOrders() {
  const response = await client.send(new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 10,       // batch up to 10
    WaitTimeSeconds: 20,           // long polling
    VisibilityTimeout: 60,         // 60s to process
  }));

  for (const message of response.Messages ?? []) {
    const receiptHandle = message.ReceiptHandle!;

    try {
      // Extend visibility if processing takes longer
      await client.send(new ChangeMessageVisibilityCommand({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: receiptHandle,
        VisibilityTimeout: 120,
      }));

      const order = JSON.parse(message.Body!);
      await fulfillOrder(order); // your business logic

      // Delete ONLY after successful processing
      await client.send(new DeleteMessageCommand({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: receiptHandle,
      }));
      console.log('Processed and deleted:', message.MessageId);

    } catch (err) {
      // Do NOT delete — let it become visible again for retry
      // After maxReceiveCount retries, SQS moves to DLQ
      console.error('Processing failed, will retry:', err);
    }
  }
}

// --- DLQ setup via AWS CDK (TypeScript) ---
// import * as sqs from 'aws-cdk-lib/aws-sqs';
// const dlq = new sqs.Queue(this, 'OrdersDLQ', {
//   retentionPeriod: Duration.days(14),
// });
// const queue = new sqs.Queue(this, 'OrdersQueue', {
//   visibilityTimeout: Duration.seconds(60),
//   deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
// });

async function fulfillOrder(order: { id: string; amount: number }) {
  // idempotent — check if already processed
  console.log('Fulfilling order:', order.id, 'amount:', order.amount);
}`,
      rw: {
        ex: [
          'Netflix uses SQS to buffer video encoding job requests — upload triggers SQS message, encoding workers poll and process without coupling to the upload service',
          'Stripe uses SQS FIFO queues for payment event processing to guarantee ordering within a payment session and exactly-once processing of charge events',
          'Amazon.com uses SQS fan-out with SNS: a single "order placed" event fans out to fulfillment, billing, analytics, and notification SQS queues simultaneously',
          'Slack uses SQS to decouple message delivery from real-time WebSocket push — messages are enqueued, workers fan them out to connected clients, DLQ captures failed deliveries',
        ],
        cs: 'A food delivery platform (DoorDash-style) uses SQS Standard queues to dispatch delivery driver assignment jobs. When an order is placed, the order service sends a message to the assignments queue. The matching service polls the queue, assigns a driver, and deletes the message. A DLQ captures orders that fail assignment after 3 retries (e.g., no available drivers in the area), triggering an alert. An SNS + SQS fan-out ensures the customer notification service, analytics pipeline, and restaurant preparation service all receive the order event independently without coupling. SQS absorbs traffic spikes during lunch/dinner rushes without the matching service needing to scale in real time.',
      },
    },

    interview: {
      q: 'When would you choose a FIFO queue over a Standard queue, and how does the visibility timeout protect against duplicate processing?',
      a: 'Choose FIFO when your business logic requires strict message ordering within a logical group (e.g., all events for a single order must be processed in sequence: created → payment → shipped) or exactly-once processing semantics (e.g., charge a credit card exactly once). FIFO prevents duplicates using a MessageDeduplicationId — SQS rejects messages with the same deduplication ID within a 5-minute window. Use Standard queues for everything else — they scale to unlimited throughput and are cheaper, but consumers must be idempotent since messages may arrive out of order or more than once.\n\nThe visibility timeout prevents two consumers from processing the same message simultaneously. When consumer A calls ReceiveMessage, SQS hides the message for the timeout duration. Consumer A processes and calls DeleteMessage — done. If consumer A crashes before deleting, the message reappears after the timeout expires and consumer B processes it. This is why consumers must be idempotent for Standard queues: the same message can be delivered more than once if a consumer dies mid-processing. For FIFO, exactly-once processing only applies within the deduplication window — after 5 minutes, a re-sent message with the same ID will be accepted again.',
      fu: [
        'How would you implement idempotency in a consumer to handle duplicate SQS messages safely?',
        'A message in your SQS queue is being processed indefinitely and never deleted — what is the root cause and how do you fix it without data loss?',
        'You need to process 10,000 messages per second with strict ordering per customer. How would you architect this with SQS FIFO given its 3,000 msg/s limit?',
      ],
    },
  },

  {
    id: 'aws-ses',
    cat: 'cloud',
    color: '#4db0c9',
    icon: '📧',
    title: 'Amazon SES',
    tag: 'Cloud email delivery at scale — transactional and marketing',

    overview:
      'Amazon SES (Simple Email Service) is a cloud-based email sending and receiving service designed for transactional emails (password resets, order confirmations, receipts, account notifications) and bulk/marketing email campaigns. It abstracts away the complexity of running an email server — SMTP infrastructure, IP reputation management, ISP relationships, bounce processing, and deliverability monitoring — so developers can send email programmatically at low cost.\n\nSES supports two sending interfaces: the SES API (via AWS SDK with SendEmail/SendRawEmail commands) and an SMTP interface compatible with any application that supports standard SMTP (port 587 with STARTTLS). Key deliverability metrics to monitor: bounce rate (hard bounces must stay below 5% — AWS suspends accounts above this threshold), complaint rate (spam reports must stay below 0.1%), and delivery rate. Exceeding these thresholds triggers account-level sending pauses.\n\nPricing is extremely cost-effective: $0.10 per 1,000 emails sent (versus $0.40/1,000 on SendGrid or $1.00/1,000 on Postmark at scale). New accounts start in sandbox mode (200 emails/day, 1 email/second) — production access must be explicitly requested, unlocking higher limits. SES integrates natively with Route 53 for DNS verification, SNS for bounce/complaint notifications, Lambda for event-driven email automation, and S3/CloudFront for email template hosting.',

    components: [
      {
        name: 'Sending Methods',
        icon: '🚀',
        role: 'Two paths to send email: AWS SDK API or SMTP relay',
        detail:
          'API Method (preferred for new builds): Use the AWS SDK SendEmailCommand or SendRawEmailCommand. SendEmail handles simple text/HTML emails with To/CC/BCC, subject, and body. SendRawEmail gives full MIME control for attachments, custom headers, multipart messages. Supports template-based sending with CreateTemplate + SendTemplatedEmail for personalized bulk email (merge variables in Handlebars-style {{variable}} syntax). SMTP Method (for legacy apps): Configure your application\'s SMTP settings to point at the SES SMTP endpoint (email-smtp.[region].amazonaws.com, port 587 with STARTTLS or port 465 with SSL). SMTP credentials are not IAM credentials — generate dedicated SMTP credentials in the SES console or convert IAM access keys using the ses-smtp-credential tool. Sending limits: sandbox (200/day, 1/s); production (default 50,000/day, 14/s, can be increased via service quota request).',
      },
      {
        name: 'Identities & Domain Authentication',
        icon: '🔐',
        role: 'Verifies ownership of sending addresses/domains and establishes email authentication to improve deliverability',
        detail:
          'Before sending, verify a sending identity: an email address (single address) or a domain (all addresses at that domain). Domain verification adds a TXT record to your DNS. DKIM (DomainKeys Identified Mail): SES generates a public/private key pair. You add three CNAME records to your DNS pointing to SES DKIM records. SES signs outgoing emails with the private key; receiving mail servers verify the signature against the public key in DNS, proving the email was not tampered with in transit. Easy DKIM uses 2048-bit RSA keys (recommended). SPF (Sender Policy Framework): authorizes SES IP addresses to send on behalf of your domain via a DNS TXT record (SES automatically handles SPF alignment when using the SES MAIL FROM domain). Custom MAIL FROM domain: replace the default amazonses.com MAIL FROM with your own subdomain (e.g., mail.yourdomain.com) for full SPF alignment. DMARC (Domain-based Message Authentication): a DNS TXT policy (_dmarc.yourdomain.com) that tells receiving servers what to do when SPF or DKIM checks fail (none/quarantine/reject). DMARC ties SPF and DKIM together — both must align with the From: header domain for DMARC to pass.',
      },
      {
        name: 'Bounce & Complaint Handling',
        icon: '⚠️',
        role: 'Manages email delivery failures and spam reports to protect sender reputation',
        detail:
          'Bounces: Soft bounces (temporary failures: mailbox full, server temporarily unavailable) — SES retries automatically for 72 hours. Hard bounces (permanent failures: address does not exist, domain invalid) — SES records these and you MUST remove them from your sending list immediately. Bounce rate above 5% → AWS pauses sending. Complaints: when a recipient clicks "Report spam" in Gmail, Yahoo, Outlook (via ISP feedback loops), SES receives a complaint notification. Complaint rate above 0.1% → account review, potential suspension. Suppression List: SES automatically adds hard-bounced and complained addresses to an account-level suppression list, blocking future sends to them. You can also add addresses manually. Automation: configure an SNS topic as the event destination for bounce and complaint notifications → Lambda function updates your database suppression list in real time → never send to bad addresses again. SES Virtual Deliverability Manager (VDM): automated insights dashboard showing bounce/complaint trends per configuration set, with actionable recommendations.',
      },
      {
        name: 'Configuration Sets',
        icon: '⚙️',
        role: 'Groups of sending rules that attach event tracking and IP management to email sends',
        detail:
          'A configuration set is a named collection of rules applied to emails that specify the set at send time (ConfigurationSetName parameter). Event Destinations: route email events (Send, Delivery, Bounce, Complaint, Open, Click, Rendering Failure) to: SNS (for real-time notification), Amazon Kinesis Firehose (for analytics/archiving to S3/Redshift), or CloudWatch (for metrics/alarms on delivery rates). Open and click tracking: SES rewrites links and adds a 1×1 pixel tracking image to measure engagement — requires default configuration or custom tracking domains. Dedicated IPs: instead of sharing AWS\'s IP pool with other SES customers, request dedicated IPs you warm up yourself. Critical for high-volume senders to isolate reputation — a burst of spam from another SES customer cannot hurt your IP. Warmup: gradually increase volume over weeks so ISPs build positive reputation history for your IP. IP Pools: assign dedicated IPs to pools and route transactional email through one pool and marketing email through another to prevent marketing bounces from hurting transactional IP reputation.',
      },
    ],

    howItWorks:
      'When your application calls the SES API (or sends via SMTP), SES authenticates the request using IAM (API) or SMTP credentials, checks that the sending identity is verified, validates that you are not on suspension, and then hands the email to its sending infrastructure. SES routes the email through its outbound SMTP servers to the recipient\'s Mail Transfer Agent (MTA — Gmail\'s servers, Outlook\'s servers, etc.). SES checks the recipient\'s domain MX records to find the correct mail server, establishes a TLS connection, and delivers the message. The recipient MTA performs SPF, DKIM, and DMARC checks using the DNS records you have configured, and decides whether to deliver the email to the inbox, spam folder, or reject it entirely. The entire send path typically completes in under 5 seconds for transactional email.\n\nReputation management is the most operationally critical aspect of SES. ISPs (Gmail, Yahoo, Outlook) track the sending behavior of each IP address and domain. If an IP sends too many bounced emails (invalid addresses), too many spam-reported emails, or suddenly ramps from 0 to 100,000 emails per day, ISPs will throttle or block it. SES manages shared IP reputation for low-to-medium volume senders by pooling traffic across many customers and enforcing strict bounce/complaint limits. For high-volume senders (above ~100,000 emails/day), dedicated IPs with a deliberate warmup schedule are essential. The warmup process involves sending a small volume on day 1 (500–1,000 emails), doubling every few days over 4–8 weeks while maintaining low bounce and complaint rates, until ISPs build a positive reputation history for your IP.\n\nEmail authentication (SPF, DKIM, DMARC) is the technical foundation of deliverability. SPF declares which IP addresses are authorized to send email for your domain. DKIM adds a cryptographic signature to every email that proves it was sent by someone with access to your private key and was not modified in transit. DMARC builds on both: it requires that the From: header domain aligns with the SPF-authenticated or DKIM-authenticated domain, and it tells receiving servers to quarantine or reject unauthenticated emails. Without DKIM, Gmail and Yahoo increasingly route emails to spam. Without DMARC, phishers can spoof your From: address to trick recipients. Configure all three for every production sending domain.\n\nConfiguration sets enable event-driven email analytics. Attach a configuration set to your sends and route events to Kinesis Firehose → S3 for a complete audit trail of every email\'s delivery status, open, and click events. Use SNS destinations for bounce and complaint events to trigger a Lambda function that immediately updates your suppression list in DynamoDB or RDS, preventing future sends to problematic addresses. SES Suppression List provides a safety net — even if your Lambda fails, SES will not deliver to hard-bounced or complained addresses. Monitor bounce and complaint rates in CloudWatch with alarms at 3% bounce (act before hitting 5% suspension threshold) and 0.08% complaint rate.',

    decision: {
      choose: [
        'SES for AWS-native applications needing cost-effective transactional email — $0.10/1,000 emails is 4–10× cheaper than alternatives at scale',
        'SES when already on AWS with IAM, Lambda, SNS, S3 — native integrations make bounce handling and event tracking simple',
        'SES for high-volume bulk email with dedicated IPs to isolate your sender reputation from shared pool',
        'SES SMTP interface for migrating existing applications with minimal code changes — just update SMTP hostname and credentials',
        'SES with SES Templates for personalized transactional email at scale without per-send HTML construction',
      ],
      avoid: [
        'SES without automated bounce/complaint handling — exceeding 5% bounce or 0.1% complaint rate suspends your account; this must be automated, not manual',
        'SES without DKIM and DMARC configured — Gmail and Yahoo enforce DMARC for bulk senders; missing authentication causes spam folder delivery or rejection',
        'SES for marketing email on shared IPs without dedicated IPs — another SES customer\'s bad behavior can damage your IP reputation',
        'SES for complex marketing email with drag-and-drop template editors, A/B testing workflows, or detailed per-subscriber analytics — use SendGrid or Mailchimp instead',
        'SES in sandbox mode for production workloads — always request production access as part of launch checklist',
      ],
      vs: [
        {
          name: 'SES vs SendGrid / Mailgun',
          when:
            'Use SendGrid or Mailgun when you need a rich self-service UI for marketing email templates, pre-built unsubscribe management, drag-and-drop email builders, out-of-the-box A/B testing, and detailed per-campaign analytics without engineering effort. They are easier to get started with and have better developer experience for non-AWS teams. Use SES when cost at scale matters (SES is 4–10× cheaper), when you need deep AWS service integration (Lambda, SNS, S3), and when you are comfortable handling bounce/complaint automation yourself.',
        },
        {
          name: 'SES vs Postmark',
          when:
            'Use Postmark when transactional email deliverability is the absolute top priority and you want a service optimized exclusively for transactional sends (Postmark refuses bulk/marketing email on its transactional streams, keeping IP reputation pristine). Postmark has best-in-class inbox placement and detailed message-level delivery tracking. Use SES when you need to send both transactional and bulk email from a single service, need AWS-native integration, or are optimizing for cost at scale.',
        },
      ],
    },

    failures: [
      {
        name: 'Bounce rate spike causing account suspension',
        cause:
          'Sending to old, unvalidated, or purchased email lists with high rates of invalid addresses. Hard bounces are permanent and counted against your sender reputation immediately.',
        symptom:
          'AWS sends an email warning that bounce rate has exceeded 5%. Sending is paused. SES console shows "Account under review." Customers stop receiving emails with no application-level error (SES accepts the send but suspends delivery).',
        fix: 'Implement double opt-in for all new email signups (user confirms email address by clicking a verification link before being added to active list). Regularly clean your sending list — remove addresses not engaged in 6–12 months. Configure SNS bounce notifications → Lambda to immediately add hard-bounced addresses to your suppression list in your database. Set a CloudWatch alarm at 3% bounce rate (before the 5% suspension threshold). Never buy email lists. Remove invalid addresses from previous campaigns before re-sending.',
        severity: 'critical',
      },
      {
        name: 'Emails landing in spam due to missing authentication',
        cause:
          'DKIM is not configured (emails lack cryptographic signature), DMARC policy is absent (no instruction for unauthenticated emails), or SPF record does not include SES IP ranges. Gmail and Yahoo now enforce DMARC for bulk senders.',
        symptom:
          'Customers report password reset / order confirmation emails going to spam. Open rates drop significantly. Google Postmaster Tools shows low domain reputation. Complaint rates rise as users manually mark emails as spam when they do find them.',
        fix: 'Enable Easy DKIM in SES for every sending domain (adds three CNAME records to DNS automatically populated by SES). Configure a custom MAIL FROM subdomain (mail.yourdomain.com) for SPF alignment. Publish a DMARC TXT record at _dmarc.yourdomain.com starting with p=none (monitoring mode), then move to p=quarantine once DKIM and SPF are confirmed working. For high volume, request dedicated IPs and warm them up gradually. Monitor using Google Postmaster Tools and Mail-Tester.com.',
        severity: 'high',
      },
      {
        name: 'Sandbox limit blocking production email sends',
        cause:
          'Account remains in SES sandbox mode after deployment. Sandbox restricts sending to verified email addresses only (cannot send to arbitrary recipients) and caps at 200 emails/day.',
        symptom:
          'Customers never receive transactional emails. SES returns MessageRejected error: "Email address is not verified." Application logs show consistent 400 errors on email sends. Only emails to the developer\'s verified test address are delivered.',
        fix: 'Request production SES access via the AWS console (Support → Service Limit Increase → SES Sending Limits) as part of the pre-launch checklist — approval typically takes 24 hours. Set a CloudWatch metric alarm on SES sending quota utilization (>80% of daily limit). Document the production access request as a launch prerequisite in your runbook.',
        severity: 'critical',
      },
    ],

    a: {
      v: 'Professional Mail Delivery Company',
      t: 'Think of SES as a professional mail delivery company versus sending letters yourself from your home address.',
      tx: 'If you tried to send 100,000 letters from your personal home address, the postal system would get suspicious — who is this person mailing so much? Many would be returned or treated as junk. But if you hire a reputable delivery company (SES) with established relationships with every post office in the world, they handle routing, reputation, and compliance. They know which addresses are invalid (bounce management) and which recipients complained previously (complaint handling). They stamp your letters with certified authentication (DKIM signature) so recipients know the letter genuinely came from you. They maintain your sending record — deliver consistently to real addresses, keep complaints low — and your mail reputation stays pristine.',
      s: 'SES provides the infrastructure, reputation, and authentication layer that makes high-volume email delivery reliable, just as a professional courier company provides the fleet, routes, and trust that individual senders lack.',
    },

    te: {
      def: 'Amazon SES is a cloud email infrastructure service that provides programmatic email sending via API or SMTP, manages sender IP reputation, handles email authentication (SPF/DKIM/DMARC), processes bounces and complaints, and routes email delivery events to AWS services for analytics and automation.',
      types: [
        {
          n: 'Transactional Email',
          d: 'One-to-one emails triggered by user actions: password reset, email verification, order confirmation, shipping notification, invoice. Require high deliverability and near-real-time delivery (< 5 seconds). Sent via API for reliability.',
        },
        {
          n: 'Bulk / Marketing Email',
          d: 'One-to-many campaign emails: newsletters, promotional offers, product updates. Sent in batches to large lists. Require list management, unsubscribe handling (CAN-SPAM/GDPR compliance), and separate IP pools to isolate reputation from transactional email.',
        },
        {
          n: 'SMTP Relay',
          d: 'Configure any application (WordPress, Magento, internal tools) to send email through SES SMTP endpoints using SES-generated SMTP credentials. Minimal code change to migrate from self-hosted mail servers to SES.',
        },
        {
          n: 'Template Email',
          d: 'SES CreateTemplate stores reusable HTML/text templates with Handlebars-style variable substitution ({{name}}, {{orderNumber}}). SendTemplatedEmail / SendBulkTemplatedEmail personalizes and sends at scale without constructing HTML per request.',
        },
      ],
      when:
        'Use SES when your application needs to send email programmatically at any scale — from a few verification emails per day to millions of transactional sends per hour. Especially compelling when already on AWS (native IAM, Lambda, SNS integration), when cost at scale matters (cheapest managed email service), or when you need fine-grained control over email authentication and reputation management.',
      trade:
        'SES requires more self-service configuration than competitors: you must set up DKIM/DMARC DNS records, implement bounce/complaint handling automation, manage suppression lists, and request production access. It lacks the polished marketing UI, drag-and-drop templates, and out-of-the-box list management of SendGrid or Mailchimp. Shared IP pools mean another customer\'s bad behavior could theoretically affect your reputation (mitigated by dedicated IPs). But the $0.10/1,000 price point and tight AWS integration make it the default choice for AWS-native applications.',
      code: `// Node.js — AWS SDK v3 SES
import {
  SESv2Client,
  SendEmailCommand,
  CreateEmailTemplateCommand,
} from '@aws-sdk/client-sesv2';
import { SNSClient } from '@aws-sdk/client-sns';

const ses = new SESv2Client({ region: 'us-east-1' });

// --- Send a transactional email ---
async function sendPasswordReset(toEmail: string, resetLink: string) {
  await ses.send(new SendEmailCommand({
    FromEmailAddress: 'no-reply@yourdomain.com',
    Destination: { ToAddresses: [toEmail] },
    ConfigurationSetName: 'transactional-config-set', // attach config set
    Content: {
      Simple: {
        Subject: { Data: 'Reset your password', Charset: 'UTF-8' },
        Body: {
          Html: {
            Data: \`<p>Click <a href="\${resetLink}">here</a> to reset your password.</p>\`,
            Charset: 'UTF-8',
          },
          Text: {
            Data: \`Reset your password: \${resetLink}\`,
            Charset: 'UTF-8',
          },
        },
      },
    },
  }));
}

// --- Lambda: Handle bounce/complaint SNS notifications ---
// Set up: SES Configuration Set → SNS Topic → Lambda trigger
export async function handleSesNotification(event: any) {
  for (const record of event.Records) {
    const notification = JSON.parse(record.Sns.Message);

    if (notification.notificationType === 'Bounce') {
      const bounce = notification.bounce;
      for (const recipient of bounce.bouncedRecipients) {
        if (bounce.bounceType === 'Permanent') {
          // Hard bounce — add to suppression list in your DB
          await addToSuppressList(recipient.emailAddress, 'hard_bounce');
          console.log('Hard bounce suppressed:', recipient.emailAddress);
        }
        // Soft bounces: SES retries automatically, no action needed
      }
    }

    if (notification.notificationType === 'Complaint') {
      for (const recipient of notification.complaint.complainedRecipients) {
        await addToSuppressList(recipient.emailAddress, 'complaint');
        await triggerUnsubscribe(recipient.emailAddress);
        console.log('Complaint suppressed:', recipient.emailAddress);
      }
    }
  }
}

async function addToSuppressList(email: string, reason: string) {
  // Write to DynamoDB suppression table
  console.log(\`Suppressing \${email} for reason: \${reason}\`);
}

async function triggerUnsubscribe(email: string) {
  // Update user preferences in your DB
  console.log(\`Unsubscribing \${email}\`);
}`,
      rw: {
        ex: [
          'Airbnb uses SES for booking confirmation, payment receipt, and host payout notification emails — millions of transactional emails per day with dedicated IPs for inbox placement',
          'GitHub uses SES for repository notification emails (PR reviews, issue comments, CI alerts) — high volume with per-user frequency preferences managed via suppression logic',
          'Duolingo uses SES for streak reminder and re-engagement email campaigns, using Configuration Set event destinations to track open rates and optimize send times per user timezone',
          'A SaaS startup uses SES SMTP relay to send emails from their Rails application (ActionMailer) without any application code changes — just SMTP hostname and credential swap',
        ],
        cs: 'An e-commerce platform processes 500,000 orders per day, each generating a confirmation email, shipping notification, and delivery confirmation — 1.5 million transactional emails daily. SES with dedicated IPs handles the volume at $150/day (vs $600/day on SendGrid). A Configuration Set routes all bounce and complaint events to an SNS topic → Lambda → DynamoDB suppression table. A CloudWatch alarm fires at 3% bounce rate before the 5% suspension threshold. DKIM, SPF with custom MAIL FROM, and DMARC p=reject are configured so emails pass all authentication checks and land in Gmail inbox. Marketing emails (weekly deals) are routed through a separate IP pool and configuration set so a marketing bounce spike cannot contaminate the transactional IP reputation.',
      },
    },

    interview: {
      q: 'How does Amazon SES handle email deliverability, and what are the critical metrics and configurations needed to maintain a healthy sender reputation?',
      a: 'Email deliverability in SES hinges on two dimensions: technical authentication and behavioral reputation. On the technical side, you must configure DKIM (SES generates a key pair; you add CNAME records; SES signs every outgoing email cryptographically), SPF (a DNS TXT record authorizing SES IP ranges to send for your domain), and DMARC (a DNS TXT policy that ties SPF and DKIM together and tells receiving servers what to do with unauthenticated emails — p=quarantine or p=reject for production). Without these, Gmail, Yahoo, and Outlook route your emails to spam or reject them outright. Since 2024, Gmail and Yahoo require DMARC for any sender sending over 5,000 emails/day.\n\nOn the behavioral side, two metrics determine whether AWS suspends your account: bounce rate (must stay below 5% — hard bounces from invalid addresses are permanent strikes) and complaint rate (must stay below 0.1% — spam reports from recipients). To manage these, you must automate bounce and complaint handling: configure a Configuration Set with an SNS event destination → Lambda function that immediately adds hard-bounced and complained addresses to a suppression table in DynamoDB → check this table before every send. Never send to an address that has bounced or complained. Implement double opt-in for list signups to validate addresses before they are added. Use the SES account-level Suppression List as a safety net.\n\nFor high-volume sending (100,000+ emails/day), use dedicated IPs to isolate your reputation from shared pool customers. Warm them up gradually over 4–8 weeks, increasing daily volume by 2× every few days while monitoring bounce and complaint rates. Use separate IP pools for transactional and marketing email so a marketing campaign spike does not hurt transactional IP reputation.',
      fu: [
        'Your SES bounce rate is at 4.8% and rising — walk me through the exact steps you take in the next 30 minutes to prevent account suspension.',
        'How would you architect a system that sends 10 million marketing emails per week through SES while guaranteeing transactional emails are never affected by marketing campaign performance?',
        'A customer claims they never received their password reset email. Describe the complete debugging process from SES API call to inbox delivery.',
      ],
    },
  },
];
