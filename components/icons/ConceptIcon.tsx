import {
  Boxes, Server, GitFork, Database, Globe, HardDrive,
  LayoutGrid, MessageSquare, Gauge, Scale, Zap, Workflow,
  MessageCircle, ListTodo, List, Shield, Network, Lock,
  ArrowLeftRight, Radio, Cpu, Braces, Package, Archive,
  UserCheck, AtSign, MapPin, Globe2, CloudLightning,
  FlaskConical, Search, Trophy, Sun, Moon, Lightbulb,
  CheckCircle2, XCircle, Copy, Check, ChevronLeft,
  ChevronRight, X, Menu, BookOpen, ChevronDown,
  Layers, Bug,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const CONCEPT_ICONS: Record<string, LucideIcon> = {
  monolith:           Boxes,
  apigateway:         Server,
  loadbalancer:       GitFork,
  caching:            Database,
  cdn:                Globe,
  databases:          HardDrive,
  sharding:           LayoutGrid,
  messagequeue:       MessageSquare,
  ratelimit:          Gauge,
  cap:                Scale,
  circuit:            Zap,
  kafka:              Workflow,
  rabbitmq:           MessageCircle,
  bullmq:             ListTodo,
  queuepatterns:      List,
  vpc:                Shield,
  subnets:            Network,
  'security-groups':  Lock,
  'nat-gateway':      ArrowLeftRight,
  'ports-protocols':  Radio,
  ec2:                Cpu,
  lambda:             Braces,
  containers:         Package,
  s3:                 Archive,
  rds:                HardDrive,
  iam:                UserCheck,
  dns:                AtSign,
  route53:            MapPin,
  cloudflare:         Globe2,
  cloudfront:         CloudLightning,
  'url-journey':      Globe,
  'dns-explained':    Search,
  'osi-tcp':          Layers,
  'https-tls':        Lock,
  'reverse-proxy':    ArrowLeftRight,
  'cdn-explained':    CloudLightning,
  'debug-network':    Bug,
};

interface ConceptIconProps {
  conceptId: string;
  size?: number;
  color?: string;
  className?: string;
}

export default function ConceptIcon({
  conceptId,
  size = 16,
  color = 'currentColor',
  className,
}: ConceptIconProps) {
  const Icon = CONCEPT_ICONS[conceptId] ?? FlaskConical;
  return <Icon size={size} color={color} className={className} strokeWidth={2} />;
}

export {
  FlaskConical,
  Search,
  Trophy,
  Sun,
  Moon,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  BookOpen,
  ChevronDown,
  Globe as GlobeIcon,
};
