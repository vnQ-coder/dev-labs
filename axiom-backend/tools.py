import os
import httpx
import json
import asyncio
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# In-memory concept cache
_concepts_cache: dict = {}
_systems_cache: dict = {}

# Concept ID to category/title mapping (always available as fallback)
CONCEPT_META = {
    # Foundation
    "monolith": {"title": "Monolith vs Microservices", "cat": "foundation"},
    "apigateway": {"title": "API Gateway", "cat": "foundation"},
    # Performance
    "loadbalancer": {"title": "Load Balancer", "cat": "performance"},
    "caching": {"title": "Caching", "cat": "performance"},
    "cdn": {"title": "CDN", "cat": "performance"},
    # Data
    "databases": {"title": "Databases", "cat": "data"},
    "sharding": {"title": "Database Sharding", "cat": "data"},
    # Async
    "messagequeue": {"title": "Message Queue", "cat": "async"},
    # Reliability
    "ratelimit": {"title": "Rate Limiting", "cat": "reliability"},
    "cap": {"title": "CAP Theorem", "cat": "reliability"},
    "circuit": {"title": "Circuit Breaker", "cat": "reliability"},
    # Messaging
    "kafka": {"title": "Apache Kafka", "cat": "messaging"},
    "rabbitmq": {"title": "RabbitMQ", "cat": "messaging"},
    "bullmq": {"title": "BullMQ", "cat": "messaging"},
    "queuepatterns": {"title": "Queue Patterns", "cat": "messaging"},
    # Cloud - Network
    "vpc": {"title": "VPC", "cat": "cloud"},
    "subnets": {"title": "Subnets", "cat": "cloud"},
    "security-groups": {"title": "Security Groups", "cat": "cloud"},
    "nat-gateway": {"title": "NAT Gateway", "cat": "cloud"},
    "ports-protocols": {"title": "Ports & Protocols", "cat": "cloud"},
    # Cloud - Delivery
    "dns": {"title": "AWS DNS", "cat": "cloud"},
    "route53": {"title": "Route 53", "cat": "cloud"},
    "cloudflare": {"title": "Cloudflare", "cat": "cloud"},
    "cloudfront": {"title": "CloudFront", "cat": "cloud"},
    # Cloud - Platform
    "ec2": {"title": "EC2 & Auto Scaling", "cat": "cloud"},
    "lambda": {"title": "AWS Lambda", "cat": "cloud"},
    "containers": {"title": "Containers: ECS & EKS", "cat": "cloud"},
    "s3": {"title": "Amazon S3", "cat": "cloud"},
    "rds": {"title": "Amazon RDS", "cat": "cloud"},
    "iam": {"title": "AWS IAM", "cat": "cloud"},
    # Cloud - New
    "kubernetes": {"title": "Kubernetes", "cat": "cloud"},
    "docker": {"title": "Docker & Containers", "cat": "cloud"},
    "ecs": {"title": "Amazon ECS", "cat": "cloud"},
    "eks": {"title": "Amazon EKS", "cat": "cloud"},
    "ecr": {"title": "Amazon ECR", "cat": "cloud"},
    # Networking / Behind the Scenes
    "url-journey": {"title": "URL Journey", "cat": "networking"},
    "dns-explained": {"title": "DNS Explained", "cat": "networking"},
    "osi-tcp": {"title": "OSI & TCP/IP", "cat": "networking"},
    "https-tls": {"title": "HTTPS & TLS", "cat": "networking"},
    "reverse-proxy": {"title": "Reverse Proxy", "cat": "networking"},
    "cdn-explained": {"title": "CDN Explained", "cat": "networking"},
    "debug-network": {"title": "Debugging Networks", "cat": "networking"},
    "osi-layers": {"title": "OSI Layers Deep Dive", "cat": "networking"},
    "network-protocols": {"title": "Network Protocols", "cat": "networking"},
}

REAL_WORLD_SYSTEMS = ["netflix", "uber", "discord", "twitter", "whatsapp", "amazon", "youtube"]


async def load_concepts_from_api():
    """Load all concepts from the Next.js API at startup."""
    global _concepts_cache
    next_url = os.getenv("NEXT_APP_URL", "http://localhost:3000")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{next_url}/api/concepts")
            if resp.status_code == 200:
                data = resp.json()
                _concepts_cache = {c["id"]: c for c in data}
                logger.info(f"Loaded {len(_concepts_cache)} concepts from API")
            else:
                logger.warning(f"Concepts API returned {resp.status_code}, using meta fallback")
    except Exception as e:
        logger.warning(f"Could not load concepts from API: {e}. Using meta fallback.")


def get_concept(concept_id: str) -> dict:
    """Tool: Get full concept data by ID."""
    concept_id = concept_id.lower().strip()
    if concept_id in _concepts_cache:
        c = _concepts_cache[concept_id]
        # Return a summarized version to stay within token limits
        return {
            "id": c.get("id"),
            "title": c.get("title"),
            "tag": c.get("tag"),
            "category": c.get("cat"),
            "overview": c.get("overview", ""),
            "howItWorks": c.get("howItWorks", ""),
            "components": [
                {
                    "name": comp.get("name"),
                    "role": comp.get("role"),
                    "detail": comp.get("detail", "")[:300],
                }
                for comp in (c.get("components") or [])[:6]
            ],
            "failures": [
                {
                    "name": f.get("name"),
                    "cause": f.get("cause"),
                    "fix": f.get("fix"),
                    "severity": f.get("severity"),
                }
                for f in (c.get("failures") or [])[:4]
            ],
            "decision": {
                "choose": (c.get("decision") or {}).get("choose", [])[:3],
                "avoid": (c.get("decision") or {}).get("avoid", [])[:3],
            },
            "interview": {
                "question": (c.get("interview") or {}).get("q", ""),
                "answer_hint": (c.get("interview") or {}).get("a", "")[:400],
                "follow_ups": (c.get("interview") or {}).get("fu", [])[:3],
            },
            "technical": {
                "definition": (c.get("te") or {}).get("def", "")[:400],
                "when_to_use": (c.get("te") or {}).get("when", "")[:300],
                "tradeoffs": (c.get("te") or {}).get("trade", "")[:300],
            },
        }
    elif concept_id in CONCEPT_META:
        meta = CONCEPT_META[concept_id]
        return {
            "id": concept_id,
            "title": meta["title"],
            "category": meta["cat"],
            "note": "Full concept data not loaded. Use your training knowledge about this topic.",
        }
    return {
        "error": f"Concept '{concept_id}' not found",
        "available_ids": list(CONCEPT_META.keys()),
    }


def search_concepts(query: str) -> list:
    """Tool: Search concepts by keyword."""
    query_lower = query.lower()
    results = []

    # Search in cache first (full data)
    if _concepts_cache:
        for cid, c in _concepts_cache.items():
            score = 0
            if query_lower in c.get("title", "").lower():
                score += 3
            if query_lower in c.get("tag", "").lower():
                score += 2
            if query_lower in c.get("overview", "").lower():
                score += 1
            if query_lower in cid.lower():
                score += 2
            if score > 0:
                results.append(
                    {
                        "id": cid,
                        "title": c.get("title"),
                        "tag": c.get("tag"),
                        "category": c.get("cat"),
                        "relevance": score,
                    }
                )
    else:
        # Fallback: search in meta
        for cid, meta in CONCEPT_META.items():
            if query_lower in cid or query_lower in meta["title"].lower():
                results.append(
                    {"id": cid, "title": meta["title"], "category": meta["cat"]}
                )

    results.sort(key=lambda x: x.get("relevance", 0), reverse=True)
    return results[:8]


def get_real_world_system(system_name: str) -> dict:
    """Tool: Get real-world system design details."""
    system_name = system_name.lower().strip()
    systems_info = {
        "netflix": {
            "name": "Netflix",
            "scale": "220M+ subscribers, 15% of global internet traffic",
            "key_patterns": [
                "CDN (Open Connect)",
                "Microservices (700+)",
                "Chaos Engineering (Chaos Monkey)",
                "Event sourcing with Kafka",
                "Zuul API Gateway",
                "Cassandra for metadata",
            ],
            "challenges": [
                "Video encoding at scale",
                "Global CDN distribution",
                "Recommendation engine",
                "Fault tolerance",
            ],
        },
        "uber": {
            "name": "Uber",
            "scale": "5M+ trips/day, 100+ cities",
            "key_patterns": [
                "Real-time location tracking with geohash",
                "Surge pricing algorithm",
                "CQRS for ride matching",
                "Kafka for event streaming",
                "Cassandra + MySQL hybrid",
            ],
            "challenges": [
                "Sub-second driver matching",
                "Dynamic pricing",
                "GPS precision at scale",
                "Multi-region consistency",
            ],
        },
        "discord": {
            "name": "Discord",
            "scale": "500M+ users, 19M+ servers",
            "key_patterns": [
                "WebSocket connections (long-lived)",
                "Cassandra for message storage",
                "Elixir for real-time",
                "ScyllaDB migration",
                "Golang services",
            ],
            "challenges": [
                "Millions of concurrent WebSocket connections",
                "Message ordering",
                "Read receipts at scale",
                "Voice/video infrastructure",
            ],
        },
        "twitter": {
            "name": "Twitter/X",
            "scale": "350M+ MAU, 500M tweets/day",
            "key_patterns": [
                "Fan-out on write (timeline)",
                "Redis for hot timelines",
                "Manhattan (distributed KV)",
                "Finagle RPC framework",
                "Kafka for event bus",
            ],
            "challenges": [
                "Celebrity account fan-out (Obama: 100M followers)",
                "Real-time trending",
                "Search indexing",
                "Tweet storm consistency",
            ],
        },
    }
    if system_name in systems_info:
        return systems_info[system_name]
    return {
        "note": f"Detailed data for '{system_name}' not in database. Use your training knowledge.",
        "available_systems": list(systems_info.keys()),
    }


def execute_tool(tool_name: str, tool_args: dict) -> str:
    """Execute a tool call and return result as JSON string."""
    try:
        if tool_name == "get_concept":
            result = get_concept(tool_args.get("concept_id", ""))
        elif tool_name == "search_concepts":
            result = search_concepts(tool_args.get("query", ""))
        elif tool_name == "get_real_world_system":
            result = get_real_world_system(tool_args.get("system_name", ""))
        else:
            result = {"error": f"Unknown tool: {tool_name}"}
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Tool {tool_name} failed: {e}")
        return json.dumps({"error": str(e)})
