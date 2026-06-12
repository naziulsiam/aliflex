'use client';

import { motion } from 'framer-motion';
import { Home, Heart, Clock, Globe, Tv } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface SidebarProps {
  groups: string[];
}

export default function Sidebar({ groups }: SidebarProps) {
  const activeGroup = useAppStore((s) => s.activeGroup);
  const setActiveGroup = useAppStore((s) => s.setActiveGroup);

  const topGroups = groups.slice(0, 30);

  const NavItem = ({
    icon: Icon,
    label,
    active,
    onClick,
  }: {
    icon: typeof Home;
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
        active ? 'bg-primary text-white' : 'text-muted hover:bg-surface hover:text-text'
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      className="hidden lg:flex flex-col w-56 flex-shrink-0 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto px-3 py-4 gap-1 border-r border-border"
    >
      <NavItem icon={Home} label="Home" active={activeGroup === null} onClick={() => setActiveGroup(null)} />
      <NavItem icon={Heart} label="Favorites" active={activeGroup === '__favorites'} onClick={() => setActiveGroup('__favorites')} />
      <NavItem icon={Clock} label="Recently Watched" active={activeGroup === '__recent'} onClick={() => setActiveGroup('__recent')} />

      <div className="mt-4 mb-1 px-3 flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
        <Globe className="w-3.5 h-3.5" />
        Categories
      </div>

      {topGroups.map((group) => (
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
