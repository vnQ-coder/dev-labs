import { Concept } from '../types';

export const CONCEPTS_CLOUD_DELIVERY: Concept[] = [
  {
    id: 'dns',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '📖',
    title: 'DNS & How the Internet Routes Traffic',
    tag: 'The phone book the whole internet shares',
    overview:
      'DNS (Domain Name System) translates human-readable domain names (stripe.com) into IP addresses (151.101.1.195) that routers understand. Without DNS, every user would need to memorize IP addresses. The system is hierarchical and distributed across millions of servers: root servers at the top, TLD servers (.com, .io, .org), then authoritative nameservers for individual domains. Responses are cached at every layer using TTL (Time To Live) values, which control how long the answer is valid — a TTL of 300 means "cache this for 5 minutes."',
    components: [
      {
        name: 'Recursive Resolver',
        icon: '🔍',
        role: 'The server that does the legwork — queries the DNS hierarchy on behalf of the client',
        detail:
          'When your browser needs to resolve stripe.com, it asks your configured DNS resolver (ISP\'s resolver, 8.8.8.8, or 1.1.1.1). The resolver knows nothing about stripe.com, but knows how to find the answer: it walks down the DNS tree from root servers to TLD servers to authoritative servers, caches the result for the TTL duration, and returns the IP to your browser. Subsequent queries from any client on the same resolver get the cached answer instantly.',
      },
      {
        name: 'Root Nameservers',
        icon: '🌍',
        role: 'The top of the DNS hierarchy — point to TLD nameservers for each top-level domain',
        detail:
          'There are 13 logical root server clusters (a.root-servers.net through m.root-servers.net) operated by organizations including ICANN, Verisign, and NASA. These 13 addresses are anycast — each maps to hundreds of physical servers worldwide. Root servers don\'t know the IP for stripe.com; they know that .com queries should go to Verisign\'s TLD servers. Root server hits are rare in practice — resolvers cache TLD nameserver locations for 48 hours.',
      },
      {
        name: 'TLD Nameservers',
        icon: '🌐',
        role: 'Authoritative for a top-level domain — point to authoritative nameservers for each domain',
        detail:
          'Verisign operates the .com TLD nameservers. When asked about stripe.com, a .com TLD server returns the NS (nameserver) records for stripe.com — telling the resolver which servers are authoritative for stripe.com (e.g., ns1.awsdns.com). TLD servers are queried very frequently; their locations are cached for 48 hours. This is why changing your domain\'s nameservers takes up to 48 hours to propagate.',
      },
      {
        name: 'Authoritative Nameserver',
        icon: '📚',
        role: 'The definitive source of DNS records for a domain — the last stop in resolution',
        detail:
          'The authoritative nameserver is where you configure A, CNAME, MX, and TXT records for your domain. For AWS-hosted domains, Route 53 acts as the authoritative nameserver. The resolver queries this server for the final answer (the A record with the IP) and caches it for the record\'s TTL. There is no further delegation — the answer from the authoritative nameserver is authoritative.',
      },
      {
        name: 'TTL (Time To Live)',
        icon: '⏱️',
        role: 'How long DNS resolvers and clients should cache the answer before re-querying',
        detail:
          'TTL is set per DNS record, measured in seconds. A TTL of 300 means "cache this IP for 5 minutes." Low TTLs (60–300s) enable fast failover during migrations — old IPs expire quickly — but increase resolver load and add lookup latency for users. High TTLs (3600–86400s) reduce DNS query load and improve cache hit rates but slow down failover. Best practice: lower TTL to 60s at least 24 hours before a planned migration, then raise it back after.',
      },
      {
        name: 'DNS Record Types',
        icon: '📄',
        role: 'Different record types encode different kinds of DNS answers',
        detail:
          'A record: maps a domain to an IPv4 address (the most common record). AAAA: maps to an IPv6 address. CNAME: creates an alias from one domain name to another (cannot be at zone apex — use ALIAS/ANAME instead). MX: identifies mail servers for the domain. TXT: arbitrary text data, used for SPF, DKIM, DMARC, and domain ownership verification. NS: lists the authoritative nameservers for the domain. SOA: Start of Authority — zone metadata including serial number and default TTL. ALIAS/ANAME: like CNAME but works at the zone apex and resolves at query time.',
      },
      {
        name: 'DNS Caching Layers',
        icon: '🗃️',
        role: 'Multiple layers of caching between the origin and the client',
        detail:
          'Browser cache (checked first, TTL-bounded, flushable with DevTools). OS resolver cache (checked second, TTL-bounded, flushable with ipconfig/flush or systemd-resolve --flush-caches). ISP recursive resolver cache (shared across millions of users, TTL-bounded, not directly flushable by you). CDN/anycast resolver cache (like 8.8.8.8 — caches for TTL). The practical implication: after changing a DNS record, stale IPs persist in all these layers until each TTL expires independently. With TTL 86400 (24 hours), users may see the old IP for 24 hours after your change.',
      },
    ],
    howItWorks:
      'A browser needs to load stripe.com. It checks its local cache — not found. It asks the OS resolver — not found. The OS asks the configured recursive resolver (1.1.1.1). The resolver checks its cache — TTL expired. The resolver queries a root nameserver: "What nameservers handle .com?" The root responds with Verisign\'s TLD server addresses and a 48-hour TTL. The resolver asks a .com TLD server: "What nameservers handle stripe.com?" The TLD server returns stripe.com\'s NS records (ns1.awsdns.com, etc.) with a 48-hour TTL. The resolver queries ns1.awsdns.com: "What is the A record for stripe.com?" The authoritative server returns the IP (151.101.1.195) with a TTL of 300 (5 minutes). The resolver caches the answer for 300 seconds and returns it to the browser. The browser connects to 151.101.1.195:443. Next user on the same resolver gets the answer from cache in microseconds.',
    decision: {
      choose: [
        'Set TTL to 60–300s at least 24 hours before a planned IP migration — ensures the old IP expires within minutes of your DNS change',
        'After migration, raise TTL back to 3600s or higher to improve cache hit rates',
        'Use ALIAS records (not CNAME) when pointing a root domain (stripe.com) to a load balancer or CDN — CNAME at the zone apex breaks MX records',
        'Keep authoritative nameservers in at least 2 providers for resilience — if your DNS provider is down, nobody can resolve your domain',
        'Use CAA records to restrict which Certificate Authorities can issue TLS certificates for your domain',
      ],
      avoid: [
        'Using TTL 86400 (24 hours) on records you might need to change during an incident — you cannot speed up cache expiry globally',
        'Deep CNAME chains (CNAME → CNAME → CNAME) — each hop adds a round-trip DNS query, increasing latency',
        'CNAME at the zone apex for your root domain — it breaks MX records and violates RFC 1912; use ALIAS/ANAME',
        'Ignoring DNS propagation when planning blue-green deployments — plan the TTL reduction 24 hours in advance',
      ],
      vs: [
        {
          name: 'CNAME vs ALIAS at zone apex',
          when: 'CNAME cannot be at the zone apex (e.g., stripe.com) per DNS RFCs because it would conflict with SOA and NS records. ALIAS (Route 53) or ANAME resolves the target at query time and returns an A record, bypassing the restriction. Always use ALIAS for root domains pointing to AWS resources like ALBs and CloudFront.',
        },
        {
          name: 'Low TTL vs High TTL',
          when: 'Low TTL (60–300s): fast failover, faster propagation, but higher DNS query volume and marginally higher latency for cache misses. High TTL (3600–86400s): better cache performance, lower DNS load, but slow recovery if you need to change IPs during an incident. Run low TTLs during migration windows; run high TTLs in steady state.',
        },
      ],
    },
    failures: [
      {
        name: 'High TTL During Migration',
        cause: 'DNS record updated to new IP but old TTL was set to 86400 (24 hours). Clients have the old IP cached and will continue using it for up to 24 hours.',
        symptom: 'After a server migration, users (and monitoring tools) continue reaching the old server. Traffic on the new server is near zero. Health checks pass on the new IP but end-user traffic hasn\'t shifted.',
        fix: 'Lower TTL to 60–300s at least 24 hours before any planned migration. Only raise it back after the migration is confirmed complete and stable. There is no way to force external resolvers to flush their cache — you must wait for TTL to expire.',
        severity: 'high',
      },
      {
        name: 'CNAME at Zone Apex Breaking Email',
        cause: 'A CNAME record is created for example.com (zone apex) pointing to an ALB or CDN hostname. The CNAME conflicts with the MX record at the zone apex.',
        symptom: 'Email to @example.com stops delivering. Mail servers cannot locate the MX record because the CNAME takes precedence in zone resolution. Website may work but email silently fails.',
        fix: 'Replace the CNAME at the apex with an ALIAS record (Route 53) or ANAME (other providers). ALIAS records are not a standard DNS record type — they\'re resolver-time flattening that returns an A record without violating zone-apex constraints.',
        severity: 'critical',
      },
      {
        name: 'DNS Propagation Delay During Incident',
        cause: 'A server is unreachable and the fix requires updating a DNS record. The record\'s TTL is 3600 seconds — the old IP will be cached for another 45 minutes.',
        symptom: 'Despite updating the DNS record, users continue hitting the broken server. Incident duration extends by hours due to DNS caching.',
        fix: 'Reduce TTL to 60s before any planned maintenance. For active incidents: if your health check provider supports it, trigger health-check-based failover (Route 53 failover routing) which removes the unhealthy endpoint at the next health check cycle (~30s) without requiring a manual DNS change.',
        severity: 'high',
      },
      {
        name: 'NXDOMAIN Cached by Resolver',
        cause: 'You query a domain before its DNS records are created. The resolver caches the NXDOMAIN (non-existent domain) response for the SOA\'s negative TTL. Then you create the records, but the resolver still serves the cached NXDOMAIN.',
        symptom: 'New domain or subdomain is not resolving even though the records were created correctly. Tools like dig @8.8.8.8 still return NXDOMAIN.',
        fix: 'Wait for the negative TTL to expire (specified in the SOA record, typically 300–3600s). Use `dig +nocache domain` to bypass your local resolver and query the authoritative server directly to verify the record exists.',
        severity: 'medium',
      },
    ],
    a: {
      v: '📱📒🔍',
      t: 'The phone book the whole internet shares',
      tx: 'Before smartphones, if you wanted to call your dentist, you looked them up in the phone book — you knew the name (dentist) but not the number (IP address). DNS is that phone book, except it\'s distributed across millions of servers globally and automatically kept up to date.\n\nHere\'s the hierarchy: imagine the phone book has an index. You look up the letter "S" — the index page says "see Volume 7." You open Volume 7, find the section for "Stripe" companies, and it says "see page 4,291 for Stripe Inc." Page 4,291 has the actual phone number. That\'s the root server (index), TLD server (volume), and authoritative server (actual page). The resolver is the librarian who does all this walking around on your behalf.\n\nThe caching system is like your personal notes. After the librarian finds the number, you write it down with an expiry: "Stripe: 415-555-1234, valid until Tuesday." Until Tuesday, you call from your notes without asking the librarian. Everyone else who called Stripe yesterday also has notes — and those notes stay accurate until each person\'s expiry date.\n\nThis is exactly why DNS changes take time to propagate: you\'ve updated the official phone book, but everyone who has the old number in their notes keeps using it until their note expires. If the note says "good for 24 hours" (TTL 86400), it takes 24 hours before everyone calls the new number.',
      s: 'The operational insight that saves incidents: TTL is not a timer that starts when you change the record. It\'s the maximum cache lifetime for each resolver that fetched the record BEFORE you changed it. If a resolver cached your A record 2 hours ago with TTL 3600, it has 1 hour remaining. Change the record now, and that resolver won\'t re-query for another hour. The solution: lower TTL to 60s at least 24 hours before any planned change. That way, when you make the change, all existing cached entries expire within 60 seconds.',
    },
    te: {
      def: 'DNS is a hierarchical, distributed naming system that maps human-readable hostnames to IP addresses. Resolution proceeds through a tree: root nameservers → TLD nameservers → authoritative nameservers → final record. Results are cached at each layer using record-level TTL values.',
      types: [
        { n: 'A Record', d: 'Maps a domain to an IPv4 address. The most fundamental DNS record. Supports multiple values (round-robin load distribution).' },
        { n: 'CNAME Record', d: 'Creates an alias from one domain name to another. Cannot exist at zone apex. Common for www.domain.com → domain.com or service.domain.com → load-balancer-dns-name.' },
        { n: 'ALIAS/ANAME Record', d: 'Non-standard extension supported by Route 53 and others. Like CNAME but works at the zone apex. Resolves the target hostname to an A record at query time, returning an IP to the caller.' },
        { n: 'MX Record', d: 'Specifies mail server hostnames for the domain. Multiple records with priority values. Email delivery uses the lowest priority number first.' },
        { n: 'TXT Record', d: 'Arbitrary text data. Used for SPF (Sender Policy Framework), DKIM public keys, DMARC policies, and domain ownership verification (Google Workspace, AWS Certificate Manager).' },
        { n: 'NS Record', d: 'Lists the authoritative nameservers for a domain. Changing NS records changes where the domain is hosted. Propagation time is bounded by the TTL on the NS records at the TLD.' },
      ],
      when: 'DNS knowledge is required for every domain name setup, TLS certificate issuance, email deliverability configuration, CDN integration, and incident response involving connectivity. Understanding TTL behavior is particularly critical during migrations and disaster recovery.',
      trade: 'DNS introduces a distributed caching layer that improves performance globally at the cost of propagation delay. High TTLs improve cache efficiency and reduce resolver load but slow migrations and failover. Low TTLs enable fast updates but increase query volume, add lookup latency on cache misses, and consume more DNS provider quota. The right TTL depends on how often the record changes and how quickly you need failover.',
      code: `# DNS debugging toolkit
# Trace full resolution chain for a domain:
dig +trace stripe.com A

# Query specific nameserver directly (bypass resolver cache):
dig @ns1.awsdns-01.org stripe.com A

# Check what IP a user in Germany would get:
dig @1.1.1.1 stripe.com A    # Cloudflare resolver
dig @8.8.8.8 stripe.com A    # Google resolver

# Check all record types:
dig stripe.com ANY

# Verify MX records for email:
dig stripe.com MX

# Check SPF / DKIM / DMARC TXT records:
dig stripe.com TXT
dig _dmarc.stripe.com TXT
dig google._domainkey.stripe.com TXT

# Find authoritative nameservers:
dig stripe.com NS

# Check negative TTL from SOA:
dig stripe.com SOA

# Flush OS DNS cache:
# macOS:   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
# Linux:   sudo systemd-resolve --flush-caches
# Windows: ipconfig /flushdns

# Python: programmatic DNS resolution
# pip install dnspython
import dns.resolver

r = dns.resolver.Resolver()
r.nameservers = ['1.1.1.1']  # Use Cloudflare directly

answers = r.resolve('stripe.com', 'A')
for rdata in answers:
    print(f"IP: {rdata.address}, TTL: {answers.ttl}s")`,
      rw: {
        ex: [
          'Cloudflare\'s 1.1.1.1 resolver achieves median DNS response times of under 15ms globally by operating anycast nodes in 300+ cities, dramatically outperforming ISP resolvers that often exceed 100ms',
          'GitHub lowered their DNS TTLs to 60s for 24 hours before every major infrastructure migration, enabling clean cutover and fast rollback without user-visible downtime',
          'Netflix uses Route 53 with latency-based routing and health checks so that DNS automatically routes users to the nearest healthy region — DNS failover is part of their multi-region HA story',
        ],
        cs: 'An e-commerce platform with DNS TTL of 86400 (24 hours) on their main A record performed a server migration on a Tuesday afternoon. DNS was updated immediately after the migration. By Wednesday morning (18 hours later), 60% of traffic had shifted to the new server, but 40% was still hitting the decommissioned old server. Customer service was flooded with reports of login failures from the users still routed to the old server. The platform had to keep the old server running for an additional 6 hours at unexpected cost. Root cause: TTL not reduced before migration. The fix for next time: reduce to 60s at least 24 hours in advance.',
      },
    },
    interview: {
      q: 'Your deployment updated the application server IP but users are still hitting the old server 2 hours later. The DNS record was changed. What are the 5 places the old IP could be cached and how do you force resolution of each?',
      a: 'The five caching layers are: (1) Browser DNS cache — holds records for TTL duration. Force flush: chrome://net-internals/#dns in Chrome, or simply close and reopen the browser. (2) OS resolver cache — the system\'s DNS cache. Force flush on macOS with dscacheutil -flushcache, Linux with systemd-resolve --flush-caches, Windows with ipconfig /flushdns. (3) Local network/DHCP server — corporate networks often run local DNS caches or forwarders. These can only be flushed by the network admin. (4) ISP recursive resolver — caches for the full TTL. You cannot flush this directly; you have to wait for TTL expiry. This is why low TTL before migration is critical. (5) CDN or third-party DNS resolver cache (8.8.8.8, 1.1.1.1) — cache for TTL. Google and Cloudflare expose flush tools (flush.campaignmonitor.com for Google, 1.1.1.1/purge-cache for Cloudflare). The long-term fix: for any planned migration, lower TTL to 60s at least 24 hours beforehand. For an active incident where the old server is unavailable and you need traffic to shift NOW, there\'s no technical way to force external resolvers to flush — the only lever is how short the TTL was when the record was last fetched.',
      fu: [
        'Explain how DNSSEC works and why, despite being a significant security improvement, most companies still don\'t enable it on their public zones.',
        'What is DNS over HTTPS (DoH) and how does it change the threat model for DNS-based security controls like corporate DNS filtering?',
        'Your company runs split-horizon DNS — internal clients resolve service.internal.company.com to private IPs while external clients get public IPs for the same name. Walk me through how you implement this with Route 53.',
        'How does Akamai\'s and Cloudflare\'s DNS-based load balancing work — why does returning multiple A records in DNS not give you true load balancing?',
        'Explain anycast routing as used by DNS root servers — how does a single IP address route users to their nearest physical DNS server without BGP configuration by the user?',
        'Your DNS provider (Route 53) experiences an outage. What is the impact to your application, and how would you design your DNS architecture to avoid a single DNS provider as a SPOF?',
      ],
    },
  },

  {
    id: 'route53',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🛣️',
    title: 'Route 53',
    tag: "AWS's DNS that also knows when your server is dead",
    overview:
      'Route 53 is AWS\'s managed DNS service. What makes it more than just DNS: health checks that automatically remove unhealthy endpoints from DNS responses, seven routing policies covering everything from simple A records to geographically-aware multi-region architectures, private hosted zones for internal VPC DNS resolution, and domain registration. The service is named after port 53 — the DNS port. Route 53 is a key building block of multi-region HA architectures because it\'s the layer where automatic failover happens without requiring application-level changes.',
    components: [
      {
        name: 'Hosted Zone',
        icon: '📁',
        role: 'Container for DNS records for a domain — public or private',
        detail:
          'A public hosted zone serves DNS records to the internet. A private hosted zone is associated with one or more VPCs and serves records only to resources within those VPCs — ideal for internal service discovery (database.internal, api.internal). Private hosted zones support overlapping domain names — you can have a private zone for example.com that overrides public resolution for resources inside your VPC.',
      },
      {
        name: 'Health Checks',
        icon: '❤️',
        role: 'Probes endpoints from multiple AWS regions; removes unhealthy endpoints from DNS',
        detail:
          'Route 53 health checkers are distributed across 15+ AWS regions. They send HTTP, HTTPS, or TCP probes every 10–30 seconds. A configurable failure threshold (default: 3 consecutive failures) determines when an endpoint is marked unhealthy. When unhealthy, Route 53 stops returning that endpoint in DNS responses. Health checks can also monitor CloudWatch alarms — enabling health-check failover based on application-level metrics, not just network reachability.',
      },
      {
        name: 'Simple Routing',
        icon: '➡️',
        role: 'Single record with one or more IP values — no health checks, no logic',
        detail:
          'Returns all values in the record. If multiple values exist, the client picks one randomly. No health checks. Use for single-target setups where availability is handled at the load balancer layer.',
      },
      {
        name: 'Weighted Routing',
        icon: '⚖️',
        role: 'Splits traffic by percentage across multiple targets — canary deploys, A/B testing',
        detail:
          'Each record set has a weight (0–255). Traffic is distributed proportionally. Weight 10 and weight 90 = 10% to the first target, 90% to the second. Use for canary releases (10% → new version), blue-green transitions, or A/B testing. Supports health checks — traffic automatically shifts away from unhealthy weighted endpoints.',
      },
      {
        name: 'Latency-Based Routing',
        icon: '⚡',
        role: 'Routes users to the AWS region with the lowest network latency from their location',
        detail:
          'Route 53 measures latency between AWS regions and end-user locations continuously. When a user queries, Route 53 returns the record pointing to the lowest-latency region. Combined with health checks: if the lowest-latency region is unhealthy, Route 53 automatically routes to the next-lowest-latency healthy region. Essential for multi-region active-active architectures.',
      },
      {
        name: 'Failover Routing',
        icon: '🔄',
        role: 'Active-passive: routes to primary; automatically falls back to secondary if health check fails',
        detail:
          'Requires health checks. Primary endpoint serves all traffic while healthy. When the health check detects failure, Route 53 returns the secondary record instead. Failover time: health check evaluation (~30s) + TTL of the record. For fast failover, set record TTL to 60s and health check interval to 10s with failure threshold 3 = failover in ~60 seconds from failure onset.',
      },
      {
        name: 'Alias Records',
        icon: '🔗',
        role: 'Route 53\'s CNAME-replacement for AWS resources — free, work at zone apex, no extra DNS lookup',
        detail:
          'Alias records are a Route 53 extension (not a standard DNS record type). They point to AWS resource DNS names (ALB, CloudFront, S3 website, Elastic Beanstalk, etc.) and Route 53 resolves them at query time, returning an A record to the client. Key advantages over CNAME: work at the zone apex (example.com, not just www.example.com), no charge for Alias queries to AWS resources, and Route 53 automatically handles changes to the underlying resource\'s IPs.',
      },
      {
        name: 'Geolocation Routing',
        icon: '🌍',
        role: 'Routes users based on their geographic location — country, continent, or default',
        detail:
          'Directs users to specific targets based on their location as determined by their source IP. Common uses: serve localized content (German users → German server), comply with data residency requirements (EU users → EU region only), or block traffic from specific countries. Always configure a default record — without it, users from unlisted locations get NODATA.',
      },
    ],
    howItWorks:
      'Route 53 health checks run continuously from 15+ AWS regions, sending HTTP GET /health to your endpoint every 10–30 seconds. Each region\'s checker votes on the endpoint\'s health. When a configurable number of regions report failure, Route 53 marks the endpoint unhealthy and removes it from responses for that record. With failover routing: all traffic goes to the primary record while it\'s healthy. If 3 consecutive health checks from more than 18% of regions fail, the primary is removed and the secondary starts being returned. With latency-based routing: each user query is answered with the record pointing to the AWS region with the lowest measured latency for that user\'s location. If that region\'s health check fails, the next-best healthy region is returned instead.',
    decision: {
      choose: [
        'Use Alias records for all AWS resource endpoints (ALB, CloudFront, S3 website) — they\'re free for queries, resolve at AWS internal network speed, and work at the zone apex',
        'Use latency-based routing for multi-region active-active — it automatically routes users to their nearest healthy region',
        'Use weighted routing for canary deployments — increment the new version\'s weight from 5% to 100% over time',
        'Use private hosted zones for internal service discovery — gives clean DNS names to VPC-internal resources without public DNS exposure',
        'Set record TTL to 60s when health-check-based failover is configured — faster failover outweighs the increased DNS query volume',
      ],
      avoid: [
        'Creating health checks that probe the wrong path or port — a health check targeting /static/logo.png isn\'t testing your application\'s health',
        'Setting TTL too high (3600+) on health-check-backed records — limits your failover speed',
        'Forgetting to associate private hosted zones with VPCs — records in the zone won\'t resolve from the VPC until associated',
        'Using multivalue answer routing as a true load balancer — DNS-based load balancing doesn\'t account for real server load; use an ALB instead',
      ],
      vs: [
        {
          name: 'Route 53 Failover vs Application-Level Failover',
          when: 'Route 53 failover is simple to configure, requires no application code, and works globally in ~60s. Application-level failover (Circuit Breaker pattern) responds in milliseconds without a DNS propagation delay and handles partial failures better. Use both: Route 53 for whole-region failures; circuit breakers for individual service failures within a region.',
        },
        {
          name: 'Latency vs Geolocation Routing',
          when: 'Latency routing: users go to the fastest-responding region. Right for most global services where you want optimal user experience. Geolocation routing: users go to a specific region based on location. Right for data residency requirements (GDPR: EU data must stay in EU) or geo-restricted content.',
        },
        {
          name: 'Route 53 vs Cloudflare DNS',
          when: 'Route 53 integrates deeply with AWS services (Alias records, VPC private zones, health check + CloudWatch alarms) and is the right choice for AWS-centric architectures. Cloudflare DNS has broader anycast coverage (300+ PoPs vs Route 53\'s ~15 health check locations) and better performance globally. Use Cloudflare in front if you need DDoS protection and edge security; keep Route 53 for internal routing.',
        },
      ],
    },
    failures: [
      {
        name: 'Health Check Wrong Path Causing False Unhealthy',
        cause: 'Health check configured to probe /health but the application serves it from /api/health, or the health check is on port 80 but the app requires HTTPS on 443',
        symptom: 'Route 53 marks healthy endpoints as unhealthy. Traffic is incorrectly routed to the secondary region. Users experience latency or errors from the suboptimal region.',
        fix: 'Verify health check configuration: correct hostname, port, protocol (HTTP vs HTTPS), and path. Test independently: curl -I https://your-endpoint/health from an external location. Enable health check logging to see exactly what response Route 53 is receiving.',
        severity: 'high',
      },
      {
        name: 'Private Hosted Zone Not Associated with VPC',
        cause: 'Private hosted zone created but not associated with the VPC where resources are trying to use it',
        symptom: 'EC2 instances in the VPC cannot resolve internal domain names (database.internal, api.service.local). DNS queries fall back to public resolution and either return NXDOMAIN or resolve to wrong IPs.',
        fix: 'Associate the private hosted zone with the VPC in the Route 53 console or via Terraform (aws_route53_zone_association). If the VPC is in a different AWS account, use the Route 53 cross-account association process via CLI.',
        severity: 'high',
      },
      {
        name: 'TTL Too High on Failover Records',
        cause: 'Failover routing configured with TTL of 3600s. When primary becomes unhealthy, clients with the old A record cached continue routing to the failed server for up to 60 minutes.',
        symptom: 'Route 53 correctly switches to secondary endpoint within 60 seconds, but clients that already resolved the primary IP before the switch continue hitting the failed server for up to TTL duration. Health dashboards show secondary as serving traffic but incident reports continue for an hour.',
        fix: 'Set TTL to 60s on all records backed by health checks. Accept the minor increase in DNS query volume — it\'s a small price for fast failover.',
        severity: 'critical',
      },
      {
        name: 'Multivalue Routing Returning Unhealthy IPs',
        cause: 'Multivalue answer routing with health checks configured, but health check IDs not attached to the individual records',
        symptom: 'Route 53 returns all records including unhealthy ones. Clients randomly land on dead servers 1/N of the time.',
        fix: 'Each record in a multivalue set must have an associated health check. Without it, Route 53 treats all records as healthy and includes them in responses.',
        severity: 'critical',
      },
    ],
    a: {
      v: '🗺️🚦🔀',
      t: "The GPS that reroutes around traffic",
      tx: 'Regular DNS is like a static map — it tells you the address and you follow it. Route 53 is a smart GPS that not only knows addresses, but actively monitors road conditions and reroutes you around accidents.\n\nImagine you\'re driving to a restaurant chain with three locations: one nearby, one across town, and one as an emergency backup. The GPS (Route 53 latency routing) normally sends you to the nearest location because it\'s fastest. It also continuously checks if each restaurant is open (health checks). If the nearest location stops responding to calls (health check fails), the GPS seamlessly directs you to the next-closest open location — no manual intervention, no calling the restaurant chain\'s support line.\n\nFor corporate events (weighted routing), you might want to split your team: 10% go to the new location to test it, 90% stay at the proven location. If the new location has problems, you reduce its weight to 0 and all traffic returns to the original.\n\nFor international franchises (geolocation routing), you might require that European customers only visit European locations — not for performance, but because of regulations about where their order data is handled. The GPS knows you\'re in Germany and directs you to the Frankfurt branch regardless of which is technically closest.\n\nThe "alias record" is like a phone number alias — instead of giving people the exact address that changes every time you move, you give them your name and let the directory find your current address. When the restaurant moves to a new building (ALB IP changes), the alias record follows it automatically.',
      s: 'The architectural insight: Route 53 health checks are the automation layer that makes multi-region failover "just work." The critical setup detail most teams miss: health check interval × failure threshold = time to detect failure. Default settings (30s interval, 3 failures) = 90s to detect. Combined with 60s TTL = ~150s total failover time. For sub-minute failover, use 10s interval + 3 failures = 30s detection + 60s TTL = 90s total. This is the minimum achievable with Route 53 health checks — for sub-30-second failover, you need application-level health management.',
    },
    te: {
      def: 'Route 53 is AWS\'s authoritative DNS service providing hosted zones, seven routing policies, health-check-based automatic failover, Alias records for AWS resource integration, and private hosted zones for VPC-internal DNS. It processes over 10 billion DNS queries per day globally.',
      types: [
        { n: 'Simple Routing', d: 'Single or multiple static values. No health checks. Used for non-critical single-target endpoints.' },
        { n: 'Weighted Routing', d: 'Splits traffic by weight ratio. Used for canary deployments, A/B testing, and gradual traffic migration.' },
        { n: 'Latency-Based Routing', d: 'Routes to lowest-latency AWS region per user location. Core component of multi-region active-active architectures.' },
        { n: 'Failover Routing', d: 'Active-passive with health check. Primary serves all traffic; secondary activates automatically on primary failure.' },
        { n: 'Geolocation Routing', d: 'Routes by user geographic location. Used for data residency requirements and geo-restricted content.' },
        { n: 'Geoproximity Routing', d: 'Routes by geographic distance with adjustable bias. Used to shift traffic between regions with fine control.' },
        { n: 'Multivalue Answer', d: 'Returns up to 8 healthy records. Basic DNS-level distribution without a load balancer layer.' },
      ],
      when: 'Route 53 is the right DNS choice for any AWS-hosted workload. Use it for all public and private DNS needs in AWS, leveraging Alias records for AWS resource integration. Add latency routing + health checks for any service that must be regionally resilient.',
      trade: 'Route 53 health checks cost $0.50–$2.00/month each, which is trivial compared to the value of automated failover. The main trade-off is that DNS-based failover has inherent latency (TTL + health check evaluation time) making it unsuitable for sub-minute failover at the application request level — circuit breakers and application-level health checks handle that. Route 53 handles the infrastructure-level failover that circuit breakers cannot: rerouting users to a different region entirely.',
      code: `# Terraform: multi-region latency routing with health checks

resource "aws_route53_health_check" "primary" {
  fqdn              = "api.us-east-1.example.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 10  # seconds
  tags = { Name = "api-us-east-1-health" }
}

resource "aws_route53_health_check" "secondary" {
  fqdn              = "api.eu-west-1.example.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 10
  tags = { Name = "api-eu-west-1-health" }
}

# Latency-based routing with health checks
resource "aws_route53_record" "api_us" {
  zone_id         = aws_route53_zone.main.zone_id
  name            = "api.example.com"
  type            = "A"
  set_identifier  = "us-east-1"
  health_check_id = aws_route53_health_check.primary.id

  latency_routing_policy {
    region = "us-east-1"
  }
  alias {
    name                   = aws_lb.us_alb.dns_name
    zone_id                = aws_lb.us_alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api_eu" {
  zone_id         = aws_route53_zone.main.zone_id
  name            = "api.example.com"
  type            = "A"
  set_identifier  = "eu-west-1"
  health_check_id = aws_route53_health_check.secondary.id

  latency_routing_policy {
    region = "eu-west-1"
  }
  alias {
    name                   = aws_lb.eu_alb.dns_name
    zone_id                = aws_lb.eu_alb.zone_id
    evaluate_target_health = true
  }
}

# Private hosted zone for internal VPC services
resource "aws_route53_zone" "internal" {
  name = "internal.example.com"
  vpc {
    vpc_id = aws_vpc.main.id
  }
}

resource "aws_route53_record" "database" {
  zone_id = aws_route53_zone.internal.zone_id
  name    = "database.internal.example.com"
  type    = "CNAME"
  ttl     = 60
  records = [aws_db_instance.main.address]
}`,
      rw: {
        ex: [
          'Netflix uses Route 53 latency-based routing plus health checks as the top layer of their multi-region failover, directing global users to healthy regional deployments automatically during region-level events',
          'Slack relies on Route 53 weighted routing for their canary deployment process — new versions receive 1% weight, monitored for 30 minutes, then gradually increased to 100%',
          'Airbnb uses private hosted zones for all internal microservice discovery, giving each service a stable DNS name (payments.internal) that survives infrastructure changes without requiring service configuration updates',
        ],
        cs: 'A SaaS company experienced a full us-east-1 outage during AWS\'s 2021 IAM event. Despite having a standby region (us-west-2) with their application deployed, manual failover took 47 minutes because their DNS was set up with CNAME records (not Alias) pointing to ALBs, with TTL of 3600s, and no health checks. After the incident, they migrated to Route 53 Alias records with latency-based routing, 60s TTL, and health checks on every endpoint. In a subsequent drill, simulated us-east-1 failure caused automatic failover to us-west-2 within 90 seconds — no manual intervention required.',
      },
    },
    interview: {
      q: 'Design a multi-region active-active architecture for a fintech app with 99.99% availability SLA using Route 53. What routing policy? What happens during a full region outage? What\'s your RPO and RTO?',
      a: 'For 99.99% (< 52 minutes downtime/year) active-active: deploy the application in at least two regions (us-east-1 + eu-west-1 minimum). Use Route 53 latency-based routing with health checks on each regional ALB — each region\'s record has a health check probing /health every 10 seconds. Set TTL to 60 seconds. For database: Aurora Global Database with the primary writer in us-east-1 and read replicas in eu-west-1. Aurora Global replication lag is < 1 second, giving RPO of ~1 second. For a full us-east-1 outage: Route 53 health check detects failure in ~30 seconds (3 × 10s). TTL expiry means all resolvers stop using the us-east-1 record within 60 seconds. Users are routed to eu-west-1. Promote Aurora eu-west-1 replica to writer — takes < 60 seconds with Aurora Global Database\'s managed failover. RTO: DNS failover 90 seconds + Aurora promotion 60 seconds = approximately 150 seconds (2.5 minutes). RPO: Aurora Global lag = < 1 second. Caveats: active-active writes require careful handling to prevent split-brain — during normal operation, all writes go to the primary region; during regional failover, you must route writes to the promoted region and handle any in-flight transactions from the failed region. This is why 99.99% SLA is achievable but requires careful operational runbook preparation and regular DR drills.',
      fu: [
        'Explain how Route 53 Application Recovery Controller (ARC) improves upon simple health-check-based failover — what problem does it solve that health checks alone can\'t?',
        'Your Route 53 health checks are passing but users in Asia are reporting 600ms latency. How would you investigate whether this is a DNS routing issue or an application issue?',
        'Describe how you would implement a "circuit breaker" at the DNS layer using Route 53 weighted routing that automatically shifts traffic based on CloudWatch metric alarms.',
        'How does Route 53 Resolver for Hybrid Connectivity work — what components are needed to enable on-premises DNS servers to resolve Route 53 private hosted zone records?',
        'Walk me through the cost model of Route 53 — what generates charges, and how would you estimate monthly costs for a multi-region setup with health checks?',
        'Explain why Route 53 is 100% SLA despite being a DNS service, and how AWS achieves that reliability. What would cause Route 53 itself to become unavailable?',
      ],
    },
  },

  {
    id: 'cloudflare',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🌩️',
    title: 'Cloudflare',
    tag: 'The security guard and speed booster sitting in front of your entire internet presence',
    overview:
      'Cloudflare operates a global network of 330+ edge locations (Points of Presence) that sit between your users and your origin servers. It provides a unified platform for CDN (cache static content at the edge), DDoS protection (absorbs volumetric attacks up to 195 Tbps at the network layer), WAF (blocks OWASP Top 10 at the edge before traffic reaches your infrastructure), the fastest DNS resolver globally (1.1.1.1), Zero Trust network access, and edge compute (Workers). Unlike AWS CloudFront, Cloudflare is cloud-agnostic — it works in front of AWS, GCP, on-premises, or any origin with an IP address.',
    components: [
      {
        name: 'Anycast Network',
        icon: '🌐',
        role: 'Routes users to the nearest Cloudflare PoP using BGP anycast without DNS tricks',
        detail:
          'Cloudflare announces the same IP prefix from all 330+ PoPs using BGP anycast. Internet routers automatically forward traffic to the nearest Cloudflare PoP based on BGP path selection. Unlike unicast (one IP → one server), anycast means one IP → nearest of many servers. This provides inherent DDoS resilience: a volumetric attack against Cloudflare\'s IP is absorbed across the entire network rather than concentrating on a single point.',
      },
      {
        name: 'CDN & Cache',
        icon: '⚡',
        role: 'Caches static and cacheable content at edge PoPs, reducing origin load and latency',
        detail:
          'Cloudflare caches assets at the edge based on Cache-Control headers, file extensions, and custom cache rules. Cache rules can override origin headers — forcing longer TTLs for static assets even if the origin serves short ones. The "Orange Cloud" mode (proxied) routes traffic through Cloudflare\'s network; "Grey Cloud" (DNS-only) bypasses it. A common misconfiguration: accidentally setting DNS-only mode exposes your origin IP to the internet.',
      },
      {
        name: 'WAF (Web Application Firewall)',
        icon: '🛡️',
        role: 'Inspects HTTP requests at the edge for OWASP Top 10, bots, and custom rules',
        detail:
          'Cloudflare\'s WAF operates at L7, inspecting URI, headers, body, and IP reputation before traffic reaches your origin. Managed rulesets cover OWASP Top 10 (SQLi, XSS, SSRF, etc.), known CVEs for popular software (WordPress, Drupal, log4j), and bot traffic. Custom rules let you block specific countries, require JS challenges, or allowlist known-good IP ranges. Running WAF at the edge means attacks are absorbed by Cloudflare\'s infrastructure, not yours.',
      },
      {
        name: 'DDoS Mitigation',
        icon: '🔰',
        role: 'Absorbs volumetric and application-layer attacks at the edge before they reach origin',
        detail:
          'Cloudflare\'s L3/L4 DDoS protection is automatic and "always on" — no configuration required. Their network has absorbed attacks exceeding 3.8 Tbps. Application-layer (L7) DDoS protection uses bot scoring, rate limiting, and JS challenges to distinguish legitimate traffic from attack traffic. Because Cloudflare\'s total network capacity dwarfs that of any single AWS region, volumetric attacks that would saturate your AWS infrastructure are absorbed transparently.',
      },
      {
        name: 'Cloudflare Tunnel',
        icon: '🔗',
        role: 'Outbound-only encrypted tunnel from your origin to Cloudflare — no inbound firewall ports needed',
        detail:
          'Cloudflare Tunnel (formerly Argo Tunnel) creates a persistent outbound connection from your server to Cloudflare\'s network. Traffic flows: user → Cloudflare edge → tunnel → your server. Your server never accepts inbound connections from the internet — the tunnel only makes outbound connections to Cloudflare. This eliminates the need for inbound firewall rules, bastion hosts, and VPNs for remote access scenarios. Tunnel is also used to expose internal services publicly without opening firewall ports.',
      },
      {
        name: 'Workers (Edge Compute)',
        icon: '⚙️',
        role: 'V8 JavaScript/WebAssembly runtime at the edge — runs code within milliseconds of users globally',
        detail:
          'Cloudflare Workers run JavaScript or WebAssembly in Cloudflare\'s V8 isolates at each PoP. They can modify request/response headers, authenticate requests, rewrite URLs, perform A/B testing, and implement business logic without cold start latency (no container spin-up). Workers KV provides globally-replicated key-value storage. Durable Objects provide strongly-consistent coordination at the edge. Workers are priced per request (100K free/day), making them cost-effective for high-traffic edge logic.',
      },
      {
        name: 'Zero Trust Access',
        icon: '🔑',
        role: 'Identity-based access to internal applications without a VPN — replaces corporate VPN for many use cases',
        detail:
          'Cloudflare Access sits in front of internal applications (exposed via Tunnel or public-facing). It requires authentication (Google Workspace, Okta, GitHub, etc.) before proxying the request to your application. Users access internal tools via a public Cloudflare subdomain; Cloudflare enforces auth and MFA at the edge. The application never receives unauthenticated traffic. This model — "never trust, always verify at the perimeter" — eliminates the need for VPN clients for accessing internal web apps.',
      },
    ],
    howItWorks:
      'When a user requests your Cloudflare-proxied domain, their DNS query returns a Cloudflare anycast IP. The user\'s traffic is routed to the nearest Cloudflare PoP via BGP. At the PoP: (1) DDoS scoring evaluates the traffic pattern — volumetric attack traffic is dropped immediately. (2) WAF rules check the HTTP request for known attack signatures — malicious requests are blocked with 403. (3) Bot management scores the request — automated bad bots get challenged or blocked. (4) Cache lookup — if the response is cached and fresh, it\'s served immediately from edge (no origin contact). Cache miss: the request is forwarded to your origin server over Cloudflare\'s optimized backbone network. The response is cached (if cacheable) and served to the user. Your origin IP is never revealed in DNS — Cloudflare\'s anycast IPs are what users see.',
    decision: {
      choose: [
        'Put Cloudflare in front of any public-facing application that requires DDoS protection — even free tier covers most attack scenarios',
        'Use Cloudflare WAF as your primary edge WAF for multi-cloud or hybrid architectures (one WAF policy, all origins)',
        'Use Cloudflare Tunnel to expose internal applications without opening inbound firewall ports — significantly reduces attack surface vs bastion hosts',
        'Use Workers for edge logic that must be sub-millisecond globally: auth token validation, A/B testing, bot mitigation, geo-based routing',
        'Use Cloudflare for origins hosted outside AWS — it provides CDN, WAF, and DDoS protection regardless of hosting provider',
      ],
      avoid: [
        'Grey-cloud (DNS-only mode) on origins you want to protect — it exposes your origin IP, bypasses all Cloudflare security, and lets attackers target you directly',
        'Aggressive cache rules that cache authenticated API responses — a cache miss on a non-cacheable endpoint is far better than serving another user\'s data from cache',
        'Forgetting to whitelist Cloudflare IP ranges on your origin firewall — this blocks legitimate Cloudflare traffic if you\'re not using Tunnel',
        'Caching POST responses — Cloudflare doesn\'t cache non-idempotent requests by default, but custom rules can accidentally enable this',
      ],
      vs: [
        {
          name: 'Cloudflare vs AWS CloudFront',
          when: 'CloudFront integrates deeply with AWS (S3, ALB, Lambda@Edge, OAC) — best for AWS-centric architectures. Cloudflare has broader PoP coverage (330+ vs CloudFront\'s 450+ but Cloudflare\'s include more tier-1 locations), better DDoS protection, and works across any origin. Use CloudFront for native AWS integration; use Cloudflare for multi-cloud, hybrid, or when you need Cloudflare\'s security capabilities.',
        },
        {
          name: 'Cloudflare WAF vs AWS WAF',
          when: 'AWS WAF integrates with ALB, CloudFront, and API Gateway — best for AWS-only architectures. Cloudflare WAF covers all origins regardless of cloud, has more managed rule sets out of the box, and includes bot management in the same platform. For multi-cloud or hybrid: Cloudflare WAF is simpler (single policy). For AWS-only: AWS WAF integrates better with native services.',
        },
        {
          name: 'Cloudflare Tunnel vs Bastion Host',
          when: 'Bastion host requires an open inbound SSH port, management, patching, and VPN client distribution. Cloudflare Tunnel requires no inbound ports, no VPN client (browser-based), and Cloudflare manages the infrastructure. For web-based internal tools, Tunnel is strictly superior. For SSH/RDP access to VMs, AWS Systems Manager Session Manager is the equivalent zero-port solution within AWS.',
        },
      ],
    },
    failures: [
      {
        name: 'Grey-Cloud Exposing Origin IP',
        cause: 'DNS record accidentally set to DNS-only (grey cloud) instead of proxied (orange cloud). Origin IP is now visible in public DNS, bypassing all Cloudflare protection.',
        symptom: 'DDoS attacks bypass Cloudflare and hit origin directly, potentially overwhelming it. WAF rules are bypassed. Attackers can target origin IP directly, persisting after orange-cloud is re-enabled if the IP is now known.',
        fix: 'Set record back to proxied (orange cloud). Change origin server IP (use new EC2, new EIP, or NAT GW) since the old IP is now known by attackers. Whitelist only Cloudflare IP ranges in origin firewall going forward.',
        severity: 'critical',
      },
      {
        name: 'Stale Auth Responses Served from Cache',
        cause: 'Cache rules set too aggressively — responses to /api/user/profile or session-based endpoints are being cached. Different users receive each other\'s cached profile data.',
        symptom: 'Users see each other\'s personal data. Auth errors appear intermittently. Session invalidation does not take effect immediately.',
        fix: 'Ensure authenticated endpoints are marked with Cache-Control: no-store or private. Add a Cache Rule in Cloudflare explicitly bypassing cache for all paths under /api/ and any path with an Authorization header or session cookie.',
        severity: 'critical',
      },
      {
        name: 'Origin IP Not Reachable from Cloudflare',
        cause: 'Origin firewall (Security Group, NACL) is locked down to specific IPs but Cloudflare IP ranges are not whitelisted. Cloudflare\'s requests to origin are dropped.',
        symptom: 'Users receive 522 (Connection Timed Out) or 521 (Web Server Is Down) errors from Cloudflare, even though the origin server is running. Origin is healthy when accessed directly.',
        fix: 'Download Cloudflare\'s IP ranges from https://www.cloudflare.com/ips/ and add them to your origin security group inbound rules. Alternatively, use Cloudflare Tunnel which creates an outbound-only connection — no inbound IP whitelisting needed.',
        severity: 'high',
      },
      {
        name: 'Workers KV Stale Reads Under Load',
        cause: 'Workers KV is eventually consistent with replication lag up to ~60 seconds. An application that requires strong consistency (rate limiting, session validation) built on Workers KV sees stale data.',
        symptom: 'Rate limit counters are incorrect — users exceed limits without triggering blocks. Session invalidations take up to 60 seconds to take effect globally.',
        fix: 'Use Durable Objects (strongly consistent) for any use case requiring consistency: rate limiting, session management, coordination. Workers KV is only appropriate for read-mostly, eventually-consistent use cases like feature flags and configuration.',
        severity: 'high',
      },
    ],
    a: {
      v: '🏰🛡️⚡',
      t: 'The castle walls that never let the siege reach the king',
      tx: 'Imagine your origin server as a king in a castle. Without Cloudflare, the castle sits on an open plain — any attacker (DDoS, hackers) can walk straight up to the walls. They know exactly where the castle is (your origin IP is in public DNS).\n\nWith Cloudflare, the castle is relocated to an unknown location, and thousands of identical-looking fortresses (330+ PoPs) are built around the world. When someone asks "where is the king?" the messengers (DNS) only reveal the nearest fortress, never the real castle location. Attackers can bombard a fortress all they like — it\'s one of hundreds, can absorb enormous attacks (195 Tbps), and your real castle is completely untouched.\n\nThe fortresses have gatekeepers (WAF) who check every visitor: "Are you carrying a weapon?" (SQL injection), "Are you impersonating someone?" (XSS), "Are you a bot?" Most legitimate visitors pass through instantly. Bad actors are turned away at the gate before ever reaching the castle walls.\n\nCloudflare Tunnel is like a secret underground passage from the castle to each fortress. Traffic flows inward through the passage, so the fortresses don\'t even need to know the castle\'s surface address. You never need to open the castle gates to the outside.\n\nWorkers are like smart magistrates stationed at each fortress who can make local decisions instantly — "This user\'s JWT is valid, let them through" — without sending a message to the castle and waiting for a reply. This eliminates the round-trip delay for common decisions.',
      s: 'The security detail that architects miss: orange-cloud (proxied) hides your origin IP — but only if it was never exposed before. If you launch with grey-cloud accidentally, your origin IP is now recorded by passive DNS scanners (SecurityTrails, Shodan, etc.) within minutes. Switching to orange-cloud won\'t help — attackers already have your IP. You must rotate the origin IP (new EIP, new server) AND then protect it with Cloudflare from the start. This is why infrastructure should always launch orange-cloud and should never have its origin IP exposed publicly.',
    },
    te: {
      def: 'Cloudflare is a global network-as-a-service platform providing CDN, DDoS mitigation, WAF, DNS, and edge compute through 330+ anycast PoPs. It sits as a reverse proxy in front of origin servers, hiding origin IPs and absorbing attacks before they reach customer infrastructure.',
      types: [
        { n: 'CDN Mode', d: 'Caches static assets at edge PoPs. Cache-Control headers control TTL. Cache rules can override origin headers. Most effective for static websites, SPA deployments, and image-heavy applications.' },
        { n: 'Reverse Proxy + WAF', d: 'All traffic proxied through Cloudflare. WAF inspects HTTP. Bot management scores requests. Suitable for any web application requiring security inspection.' },
        { n: 'Cloudflare Tunnel', d: 'Outbound-only encrypted tunnel from origin to Cloudflare edge. No inbound ports needed on origin. Ideal for exposing internal services, replacing bastion hosts, or securing origins with no public IP.' },
        { n: 'Workers & KV', d: 'Edge compute at all PoPs. Sub-millisecond latency globally for cacheable edge logic. Workers KV for eventually-consistent storage. Durable Objects for strongly-consistent edge state.' },
        { n: 'Zero Trust Access', d: 'Identity-aware access proxy for internal applications. Auth at the edge; unauthenticated traffic never reaches origin. Replaces VPN for web-based internal tool access.' },
      ],
      when: 'Use Cloudflare for any public-facing application that requires DDoS protection, WAF, and global performance. Use it as the first line of defense for origins on any cloud provider. Use Workers for edge logic that must run within 5ms of users globally.',
      trade: 'Cloudflare introduces a third-party network layer between users and your infrastructure. For most applications, this is purely beneficial — the edge improves performance, absorbs attacks, and adds security. The trade-offs: you must trust Cloudflare with all decrypted HTTPS traffic (they terminate TLS at the edge); debugging is more complex (Cloudflare logs + origin logs); Cloudflare itself is a concentration of internet traffic and occasionally has outages that affect all customers simultaneously (most notably the June 2022 outage affecting ~300 customers for ~60 minutes).',
      code: `// Cloudflare Worker: JWT auth at the edge
// Validates JWT before forwarding to origin — no auth load on origin servers

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Bypass auth for public paths
    if (url.pathname.startsWith('/public/') || url.pathname === '/health') {
      return fetch(request);
    }

    // Extract and validate JWT
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.slice(7);

    try {
      // Verify JWT using Web Crypto API (available in Workers runtime)
      const isValid = await verifyJWT(token, env.JWT_SECRET);
      if (!isValid) {
        return new Response('Forbidden', { status: 403 });
      }
    } catch {
      return new Response('Invalid token', { status: 401 });
    }

    // Check rate limit using Workers KV (eventually consistent — ok for rate limits)
    const clientIP = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const rateLimitKey = \`rate:\${clientIP}:\${Math.floor(Date.now() / 60000)}\`;
    const count = parseInt(await env.RATE_LIMIT_KV.get(rateLimitKey) ?? '0');

    if (count >= 100) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }

    await env.RATE_LIMIT_KV.put(rateLimitKey, String(count + 1), { expirationTtl: 120 });

    // Forward to origin with additional headers
    const modifiedRequest = new Request(request, {
      headers: {
        ...Object.fromEntries(request.headers),
        'X-Forwarded-By': 'cloudflare-worker',
        'CF-Ray': request.headers.get('CF-Ray') ?? '',
      }
    });

    return fetch(modifiedRequest);
  }
};

async function verifyJWT(token: string, secret: string): Promise<boolean> {
  const [header, payload, signature] = token.split('.');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const data = new TextEncoder().encode(\`\${header}.\${payload}\`);
  const sig = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, sig, data);
}`,
      rw: {
        ex: [
          'Discord uses Cloudflare to absorb DDoS attacks targeting their gaming infrastructure, routing all WebSocket traffic through Cloudflare\'s network and using Workers to perform connection routing at the edge',
          'Shopify processes over 100 billion requests per year through Cloudflare\'s network, using Workers for edge-side personalization and A/B testing without round-trips to origin',
          'Automattic (WordPress.com) uses Cloudflare in front of their WordPress hosting infrastructure, applying custom WAF rules to protect millions of WordPress sites from known CMS-specific exploits',
        ],
        cs: 'A gaming startup experienced a 120 Gbps DDoS attack at launch — their origin was hosted on AWS in a single region with no DDoS mitigation. AWS Shield Standard absorbed some traffic but their 10 Gbps NLB was overwhelmed. They migrated to Cloudflare in 20 minutes by updating their DNS to point through Cloudflare (orange cloud). The next attack — 180 Gbps — was absorbed entirely at Cloudflare\'s edge without any origin impact. Total Cloudflare cost for that month: $0 (free tier).',
      },
    },
    interview: {
      q: 'Your app is getting a 500 Gbps DDoS attack that is volumetrically larger than your total AWS region bandwidth. Walk me through your mitigation strategy assuming Cloudflare is in front of your infrastructure.',
      a: 'With Cloudflare in front, a 500 Gbps attack is primarily Cloudflare\'s problem, not yours. Cloudflare\'s L3/L4 DDoS protection activates automatically using their "Magic Transit" or "Spectrum" for volumetric attacks — their network capacity exceeds 100 Tbps, so 500 Gbps is absorbed by a tiny fraction of their global capacity. For the immediate response: confirm in Cloudflare\'s dashboard that the attack traffic is being blocked before reaching your origin — check origin server CPU/bandwidth metrics to confirm it\'s not being hit. If origin is still receiving traffic: ensure orange-cloud is active (not DNS-only mode which would bypass Cloudflare entirely), verify your origin\'s security group only accepts traffic from Cloudflare IP ranges, and consider enabling "Under Attack" mode in Cloudflare which adds a 5-second JS challenge to all visitors, blocking most bots immediately. For L7 components of the attack (HTTP floods): review the WAF events in Cloudflare dashboard, create rate limiting rules on the specific endpoints being targeted, and consider enabling bot management to challenge suspicious user agents. Simultaneously, file a Cloudflare support ticket if on a paid plan to get dedicated attention. Post-incident: implement Cloudflare Turnstile CAPTCHA on login endpoints, add custom rate limiting rules, and ensure your origin\'s real IP has never been exposed in historical DNS records.',
      fu: [
        'Explain how anycast routing enables Cloudflare to absorb DDoS attacks that exceed any single PoP\'s capacity — what happens to attack traffic as it flows through the network?',
        'Cloudflare Workers are described as "serverless at the edge" but they use V8 isolates, not containers. What is the architectural significance of this distinction for cold start behavior and multi-tenancy security?',
        'How does Cloudflare\'s Tiered Cache work, and how does it differ from a simple CDN edge cache — what problem does it solve for cache hit rates on long-tail content?',
        'Your Cloudflare Worker needs to make decisions based on real-time inventory data that changes every second. What storage primitive do you use, and what consistency trade-offs does it make?',
        'Walk me through the full TLS handshake when using Cloudflare with "Full (Strict)" SSL mode — how many TLS connections are established, and why does "Full" without "Strict" create a security hole?',
        'How would you design a Cloudflare architecture that provides both DDoS protection AND end-to-end encryption where Cloudflare cannot read the decrypted payload?',
      ],
    },
  },

  {
    id: 'cloudfront',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '⚡',
    title: 'CloudFront & CDN',
    tag: 'Warehouse your content 5ms from every user on Earth',
    overview:
      'A CDN (Content Delivery Network) is a globally distributed network of servers that cache content close to users, reducing latency and origin load. CloudFront is AWS\'s CDN with 450+ edge locations worldwide. It terminates HTTPS connections at the edge (reducing TLS handshake latency for users far from your origin), serves cached content in milliseconds, and routes cache-miss requests to your origin over AWS\'s optimized backbone. Beyond static content, CloudFront accelerates even non-cacheable API requests by terminating TLS at the edge and using AWS\'s private backbone for the origin leg — improving p99 latency by 20–40% for users far from the origin region.',
    components: [
      {
        name: 'Distribution',
        icon: '📡',
        role: 'The top-level CloudFront resource — associates origins with cache behaviors and edge settings',
        detail:
          'A CloudFront distribution has a domain name (d1a2b3.cloudfront.net) that you CNAME or Alias to your domain. It can have multiple origins (S3, ALB, custom HTTP servers) and multiple behaviors routing different URL patterns to different origins. A single distribution can serve a React SPA (/* → S3), an API (/api/* → ALB), and media files (/media/* → separate S3 bucket) — all with different cache policies per behavior.',
      },
      {
        name: 'Origins',
        icon: '🏭',
        role: 'Backend servers or storage that CloudFront fetches from on cache miss',
        detail:
          'Supported origins: S3 buckets (with OAC for access control), ALB/NLB, API Gateway, Lambda function URLs, and any publicly accessible HTTP server. For S3 origins, Origin Access Control (OAC) is the current best practice — it restricts the S3 bucket to accept requests only from CloudFront using SigV4-signed requests, making the bucket private while CloudFront serves it publicly.',
      },
      {
        name: 'Cache Behaviors',
        icon: '🗺️',
        role: 'URL pattern rules that map requests to origins and cache policies',
        detail:
          'Behaviors are evaluated in order from most to least specific. /api/* → ALB (no caching), /static/* → S3 (long TTL), /* → S3 (short TTL or no cache). Each behavior has its own cache policy (which headers, cookies, and query strings are included in the cache key), origin request policy (which headers and query strings to forward to origin), and TTL settings. Misconfiguring the cache key is a common source of serving wrong content to wrong users.',
      },
      {
        name: 'Cache Policy',
        icon: '🔑',
        role: 'Defines what makes a cached response unique — the cache key components',
        detail:
          'The cache key determines whether a request is a hit or miss. By default, only the URL path is the cache key. Adding a header (Accept-Language) to the cache key means cached responses vary by language. Adding a cookie (session_id) would mean every user gets their own cache entry — effectively no caching. AWS managed cache policies include CachingOptimized (no query strings, no headers) for maximum cache hit rate on static assets, and CachingDisabled for API endpoints.',
      },
      {
        name: 'Origin Access Control (OAC)',
        icon: '🔒',
        role: 'Restricts S3 bucket access to CloudFront using signed SigV4 requests',
        detail:
          'OAC replaced the legacy Origin Access Identity (OAI) as the secure way to serve private S3 content through CloudFront. With OAC, the S3 bucket policy allows only the CloudFront distribution principal. The bucket has no public access. CloudFront signs all origin fetch requests with its identity. This means your S3 content is never directly accessible — even if someone knows the S3 URL, they get an AccessDenied error. Only CloudFront can fetch from S3.',
      },
      {
        name: 'Lambda@Edge / CloudFront Functions',
        icon: '⚙️',
        role: 'Edge compute that runs code at CloudFront PoPs to modify requests and responses',
        detail:
          'CloudFront Functions: lightweight JavaScript functions running at all 450+ edge locations for simple request/response manipulation (header rewrites, URL redirects, basic auth). ~1ms execution limit, ~10KB code size. Lambda@Edge: full Lambda functions (Node.js or Python) running at ~30 regional edge locations. More powerful (up to 5s execution, full AWS SDK access) but fewer locations and higher latency than CF Functions. Common use: auth token validation, A/B testing, personalized content delivery, dynamic image resizing.',
      },
      {
        name: 'Cache Invalidation',
        icon: '🗑️',
        role: 'Removes cached objects from all edge locations before their TTL expires',
        detail:
          'Invalidations propagate to all edge locations within ~60 seconds but are not instantaneous. Creating an invalidation for /* clears everything but counts toward your 1,000 free invalidations/month (additional ones cost $0.005/path). The better pattern: use versioned file names (main.a1b2c3.js) for assets and long TTLs — updates "invalidate" automatically by changing the URL. Reserve invalidation paths for emergency fixes to files with unversioned names.',
      },
    ],
    howItWorks:
      'A user in Tokyo requests /images/logo.png from your CloudFront distribution. CloudFront routes the request to the nearest Tokyo edge location. The edge checks its cache: cache hit → the file is returned immediately from the edge\'s SSD cache, typically in under 5ms. Cache miss → the edge forwards the request to your origin over AWS\'s private backbone network (much faster and more reliable than the public internet). The origin responds; CloudFront caches the response at the Tokyo edge per the cache policy TTL, and returns it to the user. The next Tokyo user requesting the same file gets a cache hit in under 5ms. CloudFront also terminates the HTTPS connection at the Tokyo edge — the user\'s TLS handshake latency is the Tokyo-to-user RTT rather than the Tokyo-to-us-east-1-origin RTT.',
    decision: {
      choose: [
        'Use CloudFront for all public-facing static content — mandatory for applications serving users on multiple continents',
        'Always configure OAC when CloudFront serves S3 content — never make S3 buckets publicly accessible for web hosting',
        'Use CloudFront in front of API endpoints even if you\'re not caching — TLS termination at the edge + AWS backbone routing consistently improves latency',
        'Use versioned file names for deployable assets (JS, CSS) with long TTLs (1 year) — avoids invalidation costs and ensures instant cache busting on deploy',
        'Use CloudFront signed URLs for time-limited access to private content (video streaming, document downloads)',
      ],
      avoid: [
        'Adding user-identifying information (session cookies, user IDs) to the cache key — results in one cache entry per user, defeating the purpose of caching',
        'Using wildcard invalidations (/*) regularly — it defeats caching and incurs costs; use versioned URLs instead',
        'Forgetting to configure OAC and leaving S3 buckets publicly accessible',
        'Ignoring the Vary header — if your origin returns Vary: Accept-Encoding, CloudFront creates separate cache entries for gzipped and non-gzipped responses; if it returns Vary: Cookie, every cookie variation is a cache miss',
      ],
      vs: [
        {
          name: 'CloudFront vs Cloudflare',
          when: 'CloudFront: tighter AWS integration (S3 OAC, ALB, Lambda@Edge with IAM, WAF with Shield), better for AWS-centric architectures. Cloudflare: broader edge network for non-cached traffic (330+ PoPs vs CloudFront\'s primary tier), better DDoS protection, cloud-agnostic. For pure AWS deployments with S3 and ALB origins: CloudFront. For multi-cloud or when Cloudflare\'s security features are needed: Cloudflare.',
        },
        {
          name: 'Lambda@Edge vs CloudFront Functions',
          when: 'CloudFront Functions run at all 450+ edge locations with ~1ms limit — best for simple header manipulation, URL rewrites, and auth token inspection where latency is critical. Lambda@Edge runs at ~30 regional locations with 5s limit and full AWS SDK access — best for dynamic content generation, calling DynamoDB, or complex auth flows. CF Functions are 1/6th the cost of Lambda@Edge.',
        },
        {
          name: 'CloudFront Caching vs ElastiCache',
          when: 'CloudFront caches HTTP responses at the network edge — reduces origin requests. ElastiCache caches database query results inside your application — reduces database load. They solve different problems and are commonly used together: ElastiCache reduces DB load; CloudFront reduces ALB/application server load.',
        },
      ],
    },
    failures: [
      {
        name: 'Cache Invalidation After Deploy Not Working',
        cause: 'invalidation path pattern doesn\'t match the cached files\' paths, or invalidation was created but TTL was set to 0 and the file was already evicted from cache, or the application is using browser-side caching independent of CloudFront',
        symptom: 'After running a CloudFront cache invalidation and deploying new code, users still see the old version of the SPA. Even after clearing browser cache, the problem persists for some users.',
        fix: 'Check invalidation status in CloudFront console (should show "Completed"). Verify the invalidation path (/* invalidates everything; /index.html only invalidates that exact file). Check if the browser is caching via its own cache (add Cache-Control: no-cache to the origin response for index.html, while keeping long TTL for JS/CSS assets). Use versioned asset filenames to eliminate the invalidation problem entirely.',
        severity: 'high',
      },
      {
        name: 'S3 Publicly Accessible Without OAC',
        cause: 'CloudFront distribution configured with S3 origin but OAC not set up. S3 bucket policy grants public access to serve the website, making it directly accessible without CloudFront.',
        symptom: 'Security scan flags the S3 bucket as publicly accessible. WAF and other CloudFront security controls can be bypassed by accessing the S3 URL directly. Users may accidentally cache the S3 URL and bypass CloudFront.',
        fix: 'Create an OAC, update the distribution to use it, update the S3 bucket policy to grant access only to the CloudFront distribution principal, and disable public access on the S3 bucket.',
        severity: 'high',
      },
      {
        name: 'Vary Header Causing Cache Miss',
        cause: 'Origin returns Vary: Cookie or Vary: Authorization headers. CloudFront respects Vary and creates separate cache entries for each cookie or auth header value — effectively one cache entry per user.',
        symptom: 'Cache hit rate drops to near 0% for authenticated endpoints. CloudFront origin request volume equals total request volume. Origin is overwhelmed despite CloudFront being in front.',
        fix: 'For authenticated API endpoints that should not be cached, use the CachingDisabled managed policy. For public content endpoints where the origin incorrectly returns Vary: Cookie, override the Vary header in a CloudFront Function or configure the behavior to ignore cookies.',
        severity: 'high',
      },
      {
        name: 'CORS Preflight Responses Cached Incorrectly',
        cause: 'CORS OPTIONS preflight responses are cached without including Origin in the cache key. User from domain-a.com gets a preflight response cached for domain-b.com\'s origin, leading to CORS failures.',
        symptom: 'CORS errors in browser console for users of certain domains. Intermittent — depends on which response is in cache when a user makes a preflight request.',
        fix: 'Create a cache policy that includes the Origin request header in the cache key for behaviors serving cross-origin requests. Alternatively, handle CORS headers in a CloudFront Function that dynamically generates the Access-Control-Allow-Origin header.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🏭📦🌍',
      t: 'The global warehouse network that delivers your product in 2 hours instead of 2 weeks',
      tx: 'Imagine your product is manufactured in a factory in Virginia (your origin server in us-east-1). Without a CDN, every customer worldwide — whether in Tokyo, Lagos, or São Paulo — has to order directly from Virginia. The order takes 2 weeks to ship (high latency), puts all load on the Virginia factory (high origin load), and a storm in Virginia delays everyone\'s orders globally.\n\nCloudFront is like building regional fulfillment warehouses (edge locations) near every major city. Popular products (static assets, cached content) are stocked at every warehouse. A customer in Tokyo orders — the Tokyo warehouse has it in stock — delivered in 2 hours (5ms latency). The Virginia factory never sees that order. Only orders for custom or out-of-stock products (cache misses, non-cacheable content) go back to Virginia — and even then, CloudFront ships via a private express highway (AWS backbone) rather than the public postal service.\n\nThe warehouse catalog (cache policy) determines what gets stocked where. If every order is "custom" (non-cacheable — you added the customer\'s session ID to the cache key), every order goes to Virginia and the warehouses sit empty. The goal is making as much of your catalog as "standard" as possible — static assets, public images, common API responses.\n\nOrigin Access Control is like the factory\'s shipping policy: "We only ship to authorized warehouses, not directly to the public." If a customer finds the factory address (S3 URL) and tries to order directly, the factory rejects the request.',
      s: 'The cache key design insight that separates amateur from expert CDN configuration: every header, cookie, or query string you add to the cache key multiplies your cache entry count. URL only = 1 entry per URL. URL + Accept-Language = 1 entry per URL per language. URL + Accept-Language + session_id = effectively zero caching. Always start with the most restrictive cache key (URL only) and add dimensions only when functionally required. Check your cache hit rate in CloudFront metrics — below 90% for static content is a red flag indicating a misconfigured cache key.',
    },
    te: {
      def: 'CloudFront is AWS\'s globally distributed CDN with 450+ edge locations. It caches HTTP responses at the edge, terminates TLS connections close to users, routes cache-miss requests to origin over AWS\'s private backbone, and supports edge compute via Lambda@Edge and CloudFront Functions.',
      types: [
        { n: 'Static Asset Distribution', d: 'Long-TTL caching for JS, CSS, images, fonts. Versioned filenames enable instant cache busting without invalidations. Maximum cache hit rate for assets that rarely change.' },
        { n: 'SPA + API Distribution', d: 'Single distribution serving /index.html and /static/* from S3 (different TTLs) and /api/* from ALB with no caching. Path-based behaviors on one distribution.' },
        { n: 'API Acceleration', d: 'CloudFront in front of API Gateway or ALB with caching disabled. Benefits: TLS termination at edge, AWS backbone routing, DDoS absorption at L3/L4 via Shield Standard.' },
        { n: 'Secure Private Content', d: 'CloudFront signed URLs or signed cookies for time-limited access to private assets (video streaming, secure document downloads). OAC restricts origin S3 to CloudFront only.' },
        { n: 'Edge Personalization', d: 'Lambda@Edge or CloudFront Functions modify responses per-user: add personalization headers, perform A/B testing, validate auth tokens, or serve geo-specific content without round-trips to origin.' },
      ],
      when: 'Use CloudFront for any public-facing application with static assets. Use it for API acceleration if your users are geographically distributed. Required for high-traffic applications — the origin load reduction and latency improvement at global scale cannot be replicated any other way at comparable cost.',
      trade: 'CloudFront reduces latency and origin load at the cost of cache consistency — cached content may be stale until TTL expires or invalidations propagate. The larger the TTL, the better the cache hit rate and the higher the stale content risk. Cache invalidation propagates globally in ~60s but costs money at scale. Versioned filenames solve this trade-off for deployable assets but require build tooling support.',
      code: `# Terraform: CloudFront distribution for React SPA on S3 with OAC
# Serves / → S3 (short TTL), /static/* → S3 (long TTL), /api/* → ALB (no cache)

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "s3-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "spa" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = ["app.example.com"]

  # S3 origin (SPA + static assets)
  origin {
    domain_name              = aws_s3_bucket.spa.bucket_regional_domain_name
    origin_id                = "s3-spa"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  # ALB origin (API)
  origin {
    domain_name = aws_lb.api.dns_name
    origin_id   = "alb-api"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default behavior: serve SPA — short TTL so index.html updates quickly
  default_cache_behavior {
    target_origin_id       = "s3-spa"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"  # CachingOptimized
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
  }

  # /static/* — long TTL (versioned filenames)
  ordered_cache_behavior {
    path_pattern           = "/static/*"
    target_origin_id       = "s3-spa"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 31536000  # 1 year — versioned files never change
    default_ttl            = 31536000
    max_ttl                = 31536000
  }

  # /api/* — no cache, forward to ALB
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = "alb-api"
    viewer_protocol_policy   = "redirect-to-https"
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"  # CachingDisabled
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"  # AllViewer
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
  }

  # S3 bucket policy — only allow CloudFront OAC
  # (set in separate aws_s3_bucket_policy resource)

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }
}`,
      rw: {
        ex: [
          'GitHub serves all static assets (JS, CSS, images) through CloudFront with 1-year TTLs and content-hashed filenames — their CDN cache hit rate exceeds 99% for static content, with origin almost never hit for repeat visitors',
          'Airbnb uses CloudFront for both static SPA delivery and API acceleration — even non-cached API requests benefit from TLS at the edge and AWS backbone routing, reducing p99 latency 25-30% for European users hitting US-east-1',
          'Amazon.com itself uses CloudFront for product images and static assets, serving billions of images daily with sub-10ms latency globally from edge caches',
        ],
        cs: 'A media streaming startup deployed their React SPA on S3 + CloudFront with default settings. After a deployment, they ran a cache invalidation for /* but users in Australia and Asia continued seeing the old version for 2 minutes. Investigation revealed: the invalidation completed in 45 seconds (correct), but their origin was returning Cache-Control: max-age=3600 for index.html, so browsers had independently cached the old version. The fix was configuring the CloudFront behavior to override Cache-Control for index.html with Cache-Control: no-cache (so browsers always re-validate) while keeping long TTLs for /static/* versioned assets. Post-fix, deployments became globally visible within 90 seconds of invalidation — browser cache now validates against CloudFront which has the new version.',
      },
    },
    interview: {
      q: 'Your SPA (React app on S3 + CloudFront) is showing the old version to users 30 minutes after a deploy. You ran cache invalidation but it didn\'t help. Debug this.',
      a: 'The fact that CloudFront invalidation ran but users still see old content tells me CloudFront is not the layer holding the stale content. I\'d investigate in this order: (1) Confirm the invalidation completed — check CloudFront console for "Completed" status. If it shows "In Progress" after 10 minutes, something is wrong with the distribution. (2) Check what CloudFront is serving — bypass the browser with curl -I https://your-domain/index.html and look at the response headers: Age (time the object has been in cache), X-Cache (Hit or Miss from CloudFront), and Cache-Control. If the file is already invalidated and CloudFront is serving the new version, the problem is browser-side. (3) If CloudFront is serving the new version but the browser shows old: the browser has cached index.html independently. Look at the Cache-Control header in the response. If it\'s max-age=3600 or similar, the browser cached it and won\'t re-check for an hour. Fix: configure the S3 object metadata or CloudFront behavior to serve index.html with Cache-Control: no-cache, no-store or Cache-Control: max-age=0, must-revalidate. (4) If CloudFront is serving the OLD version despite invalidation: verify the invalidation path — /index.html only invalidates that specific file; /app/index.html would be different. Also check if there are multiple distributions — the invalidation might have run on the wrong one. Long-term fix: index.html should never be cached with a TTL > 0; use versioned filenames for all other assets (webpack/vite do this automatically with content hashes).',
      fu: [
        'Explain the difference between CloudFront\'s TTL, the origin\'s Cache-Control max-age, and the browser\'s cache — how do these three interact and which takes precedence?',
        'Design a CloudFront configuration for a personalized news website where 80% of content is public (cached) and 20% requires user authentication (not cached). How do you architect behaviors to maximize cache hit rate?',
        'Lambda@Edge vs CloudFront Functions — explain the execution model for each, their latency characteristics, and a concrete use case where you\'d choose Lambda@Edge over CF Functions.',
        'How do CloudFront signed URLs differ from signed cookies, and when would you use each for protecting private content like a paid video streaming service?',
        'Explain how CloudFront Origin Shield works and why it improves cache hit rates for globally distributed distributions — under what circumstances is the added latency and cost justified?',
        'Your CloudFront distribution is receiving 10 million requests per day with a 40% cache hit rate on static assets. The remaining 60% are cache misses hitting your ALB. How do you diagnose what\'s causing the low hit rate and improve it to 95%+?',
      ],
    },
  },
];
