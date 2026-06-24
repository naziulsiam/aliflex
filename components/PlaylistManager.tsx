'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, FileText, Plus, Trash2, Check, Radio, ListPlus, Film, Info } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface PlaylistManagerProps {
  open: boolean;
  onClose: () => void;
}

type TabType = 'import-url' | 'paste-text' | 'single-channel' | 'my-playlists';

export default function PlaylistManager({ open, onClose }: PlaylistManagerProps) {
  const {
    customPlaylists,
    activePlaylistId,
    customChannels,
    addCustomPlaylist,
    deleteCustomPlaylist,
    setActivePlaylistId,
    addIndividualChannel,
    deleteIndividualChannel,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('my-playlists');
  
  // URL form
  const [playlistName, setPlaylistName] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  
  // Text form
  const [playlistRawName, setPlaylistRawName] = useState('');
  const [playlistRawText, setPlaylistRawText] = useState('');
  
  // Single stream form
  const [streamName, setStreamName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamLogo, setStreamLogo] = useState('');
  const [streamGroup, setStreamGroup] = useState('');
  const [streamCountry, setStreamCountry] = useState('');

  // Status message
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim() || !playlistUrl.trim()) {
      setStatus({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const added = await addCustomPlaylist(playlistName, playlistUrl);
      setStatus({
        type: 'success',
        message: `Successfully imported "${added.name}" with ${added.channels.length} channels!`,
      });
      setPlaylistName('');
      setPlaylistUrl('');
      // Auto switch to list
      setTimeout(() => {
        setActiveTab('my-playlists');
        setActivePlaylistId(added.id);
        setStatus({ type: null, message: '' });
      }, 1500);
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err?.message || 'Failed to fetch or parse the M3U playlist. Check the URL and CORS.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportRawText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistRawName.trim() || !playlistRawText.trim()) {
      setStatus({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const added = await addCustomPlaylist(playlistRawName, undefined, playlistRawText);
      setStatus({
        type: 'success',
        message: `Successfully imported "${added.name}" with ${added.channels.length} channels!`,
      });
      setPlaylistRawName('');
      setPlaylistRawText('');
      setTimeout(() => {
        setActiveTab('my-playlists');
        setActivePlaylistId(added.id);
        setStatus({ type: null, message: '' });
      }, 1500);
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err?.message || 'Failed to parse M3U text. Ensure it starts with #EXTM3U',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingleChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamName.trim() || !streamUrl.trim()) {
      setStatus({ type: 'error', message: 'Stream name and URL are required.' });
      return;
    }

    try {
      addIndividualChannel(
        streamName,
        streamUrl,
        streamLogo || undefined,
        streamGroup || undefined,
        streamCountry || undefined
      );
      setStatus({
        type: 'success',
        message: `Successfully added stream "${streamName}"!`,
      });
      setStreamName('');
      setStreamUrl('');
      setStreamLogo('');
      setStreamGroup('');
      setStreamCountry('');
      setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 3000);
    } catch (err: any) {
      setStatus({ type: 'error', message: 'Failed to add stream.' });
    }
  };

  const selectPlaylist = (id: string) => {
    setActivePlaylistId(id);
    setStatus({ type: 'success', message: 'Playlist updated successfully!' });
    setTimeout(() => setStatus({ type: null, message: '' }), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 md:p-6 pointer-events-none select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl bg-surface border border-border rounded-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl pointer-events-auto text-text"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-black tracking-tight">Stream & Playlist Manager</h3>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                  aria-label="Close manager"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-border/60 overflow-x-auto scrollbar-hide px-4 pt-2">
                {(
                  [
                    { id: 'my-playlists', label: 'My Playlists', icon: Radio },
                    { id: 'import-url', label: 'Import URL', icon: Link2 },
                    { id: 'paste-text', label: 'Paste M3U', icon: FileText },
                    { id: 'single-channel', label: 'Add Stream', icon: Plus },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setStatus({ type: null, message: '' });
                      }}
                      className={`relative flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                        active ? 'text-white' : 'text-muted hover:text-text'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {active && (
                        <motion.div
                          layoutId="manager-tab-active"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status Banner */}
              <AnimatePresence>
                {status.type && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`px-6 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                      status.type === 'success' ? 'bg-green-500/15 text-green-400 border-b border-green-500/10' : 'bg-primary/15 text-primary border-b border-primary/10'
                    }`}
                  >
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>{status.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content Panel */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {/* TAB: My Playlists */}
                  {activeTab === 'my-playlists' && (
                    <motion.div
                      key="my-playlists"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">IPTV Playlists</h4>
                        <div className="space-y-2.5">
                          {/* Default/Preset Playlist */}
                          <div
                            onClick={() => selectPlaylist('__default')}
                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                              activePlaylistId === '__default'
                                ? 'bg-primary/5 border-primary/40 shadow-inner'
                                : 'bg-surface2/50 border-border hover:border-border/80 hover:bg-surface2/80'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-sm">Preset Live Matches (Default)</p>
                              <p className="text-xs text-muted mt-0.5">10 default live sports streaming channels</p>
                            </div>
                            {activePlaylistId === '__default' && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                              </div>
                            )}
                          </div>

                          {/* Custom Playlists */}
                          {customPlaylists.map((pl) => (
                            <div
                              key={pl.id}
                              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                activePlaylistId === pl.id
                                  ? 'bg-primary/5 border-primary/40 shadow-inner'
                                  : 'bg-surface2/50 border-border'
                              }`}
                            >
                              <div
                                onClick={() => selectPlaylist(pl.id)}
                                className="flex-1 min-w-0 cursor-pointer"
                              >
                                <p className="font-bold text-sm truncate">{pl.name}</p>
                                <p className="text-xs text-muted mt-0.5 truncate">
                                  {pl.channels.length} channel{pl.channels.length !== 1 ? 's' : ''} {pl.url ? `• ${pl.url}` : '• Custom M3U'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {activePlaylistId === pl.id && (
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                                  </div>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCustomPlaylist(pl.id);
                                  }}
                                  className="p-2 rounded-lg bg-white/5 hover:bg-primary/10 hover:text-primary transition-colors text-muted"
                                  aria-label="Delete playlist"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Custom Individual Channels */}
                      <div>
                        <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">
                          Individually Added Streams ({customChannels.length})
                        </h4>
                        {customChannels.length === 0 ? (
                          <div className="p-6 rounded-xl border border-dashed border-border/60 text-center text-muted/65 text-sm">
                            No individual stream links added yet. Add one in the &ldquo;Add Stream&rdquo; tab.
                          </div>
                        ) : (
                          <div className="max-h-[180px] overflow-y-auto space-y-2 border border-border/40 rounded-xl p-2.5">
                            {customChannels.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between px-3 py-2 bg-surface2/30 rounded-lg hover:bg-surface2/60 transition-colors"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate">{c.name}</p>
                                  <p className="text-[10px] text-muted truncate">{c.url}</p>
                                </div>
                                <button
                                  onClick={() => deleteIndividualChannel(c.id)}
                                  className="p-1.5 rounded bg-white/5 hover:bg-primary/10 hover:text-primary transition-colors text-muted"
                                  aria-label="Delete stream"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB: Import URL */}
                  {activeTab === 'import-url' && (
                    <motion.form
                      key="import-url"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleImportUrl}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Playlist Name</label>
                        <input
                          type="text"
                          required
                          value={playlistName}
                          onChange={(e) => setPlaylistName(e.target.value)}
                          placeholder="e.g. World Sports Channels"
                          className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/60"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">M3U Playlist URL</label>
                        <input
                          type="url"
                          required
                          value={playlistUrl}
                          onChange={(e) => setPlaylistUrl(e.target.value)}
                          placeholder="https://example.com/playlist.m3u"
                          className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/60"
                        />
                        <p className="text-[11px] text-muted/80 mt-1.5 flex items-start gap-1">
                          <span className="text-primary font-bold">Note:</span> 
                          For secure connection and CORS bypass, the URL will be fetched via our serverless endpoint.
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-extrabold text-sm shadow-xl shadow-primary/10 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Importing & Parsing…' : 'Import Playlist'}
                      </motion.button>
                    </motion.form>
                  )}

                  {/* TAB: Paste M3U */}
                  {activeTab === 'paste-text' && (
                    <motion.form
                      key="paste-text"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleImportRawText}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Playlist Name</label>
                        <input
                          type="text"
                          required
                          value={playlistRawName}
                          onChange={(e) => setPlaylistRawName(e.target.value)}
                          placeholder="e.g. My Custom Matches"
                          className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/60"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Raw M3U Content</label>
                        <textarea
                          required
                          rows={6}
                          value={playlistRawText}
                          onChange={(e) => setPlaylistRawText(e.target.value)}
                          placeholder="#EXTM3U&#10;#EXTINF:-1,My Channel&#10;https://example.com/live.m3u8"
                          className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/60 font-mono resize-none"
                        />
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-extrabold text-sm shadow-xl shadow-primary/10 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Parsing Content…' : 'Import Raw M3U'}
                      </motion.button>
                    </motion.form>
                  )}

                  {/* TAB: Add Stream */}
                  {activeTab === 'single-channel' && (
                    <motion.form
                      key="single-channel"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleAddSingleChannel}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Stream Name *</label>
                          <input
                            type="text"
                            required
                            value={streamName}
                            onChange={(e) => setStreamName(e.target.value)}
                            placeholder="e.g. My Sport Channel"
                            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/60"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Stream URL * (.m3u8 / .mp4)</label>
                          <input
                            type="url"
                            required
                            value={streamUrl}
                            onChange={(e) => setStreamUrl(e.target.value)}
                            placeholder="https://example.com/stream.m3u8"
                            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/60"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Logo Image URL (Optional)</label>
                          <input
                            type="url"
                            value={streamLogo}
                            onChange={(e) => setStreamLogo(e.target.value)}
                            placeholder="https://example.com/logo.jpg"
                            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/60"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Country (Optional)</label>
                          <input
                            type="text"
                            value={streamCountry}
                            onChange={(e) => setStreamCountry(e.target.value)}
                            placeholder="e.g. US"
                            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/60"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Category Group (Optional)</label>
                        <input
                          type="text"
                          value={streamGroup}
                          onChange={(e) => setStreamGroup(e.target.value)}
                          placeholder="e.g. Live Sports, Entertainment"
                          className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/60"
                        />
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-extrabold text-sm shadow-xl shadow-primary/10 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Stream Link
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
