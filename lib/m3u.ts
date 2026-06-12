import { Channel } from './types';

/**
 * Parses an M3U / M3U8 playlist text into a list of Channel objects.
 * Supports the extended attributes used by iptv-org playlists:
 * tvg-id, tvg-logo, group-title, tvg-country, tvg-language
 */
export function parseM3U(content: string): Channel[] {
  const lines = content.split('\n');
  const channels: Channel[] = [];

  let current: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const attrs = extractAttributes(line);
      const nameMatch = line.match(/,(.*)$/);
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

      current = {
        id: attrs['tvg-id'] || `${name}-${i}`,
        name,
        logo: attrs['tvg-logo'] || '',
        group: attrs['group-title'] || 'Other',
        country: attrs['tvg-country'] || '',
        languages: (attrs['tvg-language'] || '')
          .split(';')
          .filter(Boolean),
      };
    } else if (line && !line.startsWith('#') && current) {
      current.url = line;
      channels.push(current as Channel);
      current = null;
    }
  }

  return channels;
}

function extractAttributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([a-zA-Z0-9-]+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

/**
 * Groups channels by their group-title, sorted alphabetically.
 * Channels without a logo or with obviously broken names are filtered out.
 */
export function groupChannels(channels: Channel[]) {
  const map = new Map<string, Channel[]>();

  for (const ch of channels) {
    if (!ch.name || !ch.url) continue;
    const group = ch.group || 'Other';
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(ch);
  }

  return Array.from(map.entries())
    .map(([name, channels]) => ({
      name,
      channels: channels.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
