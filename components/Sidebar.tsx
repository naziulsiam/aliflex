'use client';

import { motion } from 'framer-motion';
import { Home, Heart, Clock, Globe, Tv } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface SidebarProps {
  groups: string[];
}

const PINNED = [
  { icon: Home,  label: 'Home',             value: null as string | null },
  { icon: Heart, label: 'My List',          value: '__favorites' },
  { icon: Clock, label: 'Continue Watching', value: '__recent' },
];

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left select-none ${
        active ? 'text-white' : 'text-muted hover:text-text hover:bg-surface2'
      }`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-lg bg-primary"
          transition={{ type: 'spring', damping: 30, stiffness: 380 }}
        />
      )}
      <Icon className="w-4 h-4 flex-shrink-0 relative z-10" />
      <span className="truncate relative z-10">{label}</span>
    </button>
  );
}

export default function Sidebar({ groups }: SidebarProps) {
  const activeGroup    = useAppStore(s => s.activeGroup);
  const setActiveGroup = useAppStore(s => s.setActiveGroup);
  const topGroups      = groups.slice(0, 40);

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
      className="hidden lg:flex flex-col w-56 flex-shrink-0 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto px-3 py-4 gap-0.5 border-r border-border/60"
    >
      {/* Pinned nav */}
      {PINNED.map(item => (
        <NavItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          active={activeGroup === item.value}
          onClick={() => setActiveGroup(item.value)}
        />
      ))}

      {/* Section divider */}
      <div className="mt-4 mb-1.5 px-3 flex items-center gap-2 text-[11px] font-bold text-muted uppercase tracking-widest">
        <Globe className="w-3 h-3" />
        Categories
      </div>

      {topGroups.map(group => (
        <NavItem
          key={group}
          icon={Tv}
          label={group}
          active={activeGroup === group}
          onClick={() => setActiveGroup(group)}
        />
      ))}
    </motion.aside>
  );
}
