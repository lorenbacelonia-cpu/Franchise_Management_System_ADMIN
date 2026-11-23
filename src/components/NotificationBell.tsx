import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFranchise } from '../context/FranchiseContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  FileCheck2,
  X,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { isRecordExpired } from '../utils/fareUtils';

export interface NotificationItem {
  id: string;
  type: 'review' | 'renewal' | 'complaint' | 'violation';
  title: string;
  description: string;
  vehicleCategory?: 'Tricycle' | 'Pedicab';
  plateOrMtop?: string;
  date: string;
  severity: 'high' | 'medium' | 'info';
  targetData?: any;
}

const STORAGE_KEY_SOUND = 'tabaco_trd_notification_sound_enabled';

/**
 * High-definition synthetic chime using the browser Web Audio API.
 * Dual-tone chime: D5 (587Hz) to A5 (880Hz) with smooth harmonic shimmer.
 */
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: Clear fundamental bell note (D5 -> A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);

    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Tone 2: Harmonic sparkle (A5 -> D6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.12, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.45);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.55);
  } catch (e) {
    console.debug('Notification audio playback prevented:', e);
  }
};

export const NotificationBell: React.FC = () => {
  const {
    pendingReviews,
    franchises,
    complaints,
    violations,
    setActiveModule,
    setSelectedReview,
  } = useFranchise();

  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'review' | 'renewal' | 'complaint' | 'violation'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sound preference state (enabled by default)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SOUND);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_SOUND, String(next));
      } catch {}
      if (next) {
        playNotificationChime();
      }
      return next;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Build notifications from live state
  const notifications = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Pending Reviews
    pendingReviews.forEach(r => {
      if (r.status === 'Pending Document Review' || !r.status) {
        list.push({
          id: `rev-${r.id}`,
          type: 'review',
          title: `Pending Review: ${r.applicantName}`,
          description: `${r.applicationType || 'Franchise Intake'} awaiting document inspection`,
          vehicleCategory: r.vehicleCategory,
          plateOrMtop: r.cityPlateAssigned || r.mtopAssigned,
          date: r.dateSubmitted || 'Recent',
          severity: 'high',
          targetData: r,
        });
      }
    });

    // 2. Expired / Pending Renewals
    franchises.forEach(f => {
      const expired = f.status === 'Expired' || isRecordExpired(f.expirationDate);
      const pendingRenewal = f.status === 'Pending Renewal';
      if (expired || pendingRenewal) {
        list.push({
          id: `ren-${f.id}`,
          type: 'renewal',
          title: `${pendingRenewal ? 'Pending Renewal' : 'Expired Franchise'}: ${f.cityPlateNumber || f.mtopNumber}`,
          description: `Operator: ${f.operatorName || f.ownerName || 'N/A'} — Valid until ${f.expirationDate || 'N/A'}`,
          vehicleCategory: f.vehicleCategory,
          plateOrMtop: f.cityPlateNumber || f.mtopNumber,
          date: f.expirationDate || 'Overdue',
          severity: expired ? 'high' : 'medium',
          targetData: f,
        });
      }
    });

    // 3. Passenger Complaints under investigation
    complaints.forEach(c => {
      if (c.status !== 'Resolved') {
        list.push({
          id: `comp-${c.id}`,
          type: 'complaint',
          title: `Complaint: ${c.issueType}`,
          description: `Plate: ${c.cityPlateNumber || c.mtopNumber || 'N/A'} — ${c.description ? c.description.slice(0, 60) + '...' : 'Awaiting admin response'}`,
          vehicleCategory: c.vehicleCategory || 'Tricycle',
          plateOrMtop: c.cityPlateNumber || c.mtopNumber,
          date: c.incidentDate || 'Recent',
          severity: c.status === 'Escalated' ? 'high' : 'medium',
          targetData: c,
        });
      }
    });

    // 4. Violations unsettled
    violations.forEach(v => {
      if (v.status !== 'Settled') {
        list.push({
          id: `viol-${v.id}`,
          type: 'violation',
          title: `Citation: ${v.violationType}`,
          description: `Plate ${v.cityPlateNumber || v.mtopNumber} — Driver: ${v.driverName} (Fine: ₱${Number(v.fineAmount || 0).toLocaleString()})`,
          vehicleCategory: (v as any).vehicleCategory || 'Tricycle',
          plateOrMtop: v.cityPlateNumber || v.mtopNumber,
          date: v.dateSubmitted || 'Recent',
          severity: 'medium',
          targetData: v,
        });
      }
    });

    return list;
  }, [pendingReviews, franchises, complaints, violations]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  // Track previous notification count to trigger chime on incoming alerts
  const isFirstMountRef = useRef(true);
  const prevCountRef = useRef(unreadCount);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevCountRef.current = unreadCount;
      return;
    }

    if (unreadCount > prevCountRef.current && soundEnabled) {
      playNotificationChime();
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, soundEnabled]);

  const filteredNotifications = useMemo(() => {
    if (filterType === 'all') return notifications;
    return notifications.filter(n => n.type === filterType);
  }, [notifications, filterType]);

  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
  };

  const handleToggleOpen = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && soundEnabled && unreadCount > 0) {
      playNotificationChime();
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setReadIds(prev => new Set(prev).add(item.id));
    setIsOpen(false);

    if (item.type === 'review') {
      setActiveModule('overview');
      if (item.targetData) {
        setSelectedReview(item.targetData);
      }
      setTimeout(() => {
        document.getElementById('pending-reviews-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (item.type === 'renewal') {
      setActiveModule('renewal');
    } else if (item.type === 'complaint') {
      setActiveModule('overview');
      setTimeout(() => {
        const el = document.getElementById('pending-reviews-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (item.type === 'violation') {
      setActiveModule('violation_entry');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger Button */}
      <button
        type="button"
        onClick={handleToggleOpen}
        className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
        title="View Notifications"
        aria-label="View notifications"
      >
        <Bell className="h-4 w-4 text-slate-700" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[92vw] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400">Tricycle &amp; Pedicab alerts</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={toggleSound}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 text-[10px] font-bold ${
                  soundEnabled
                    ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-300 bg-slate-800 border border-slate-700'
                }`}
                title={soundEnabled ? 'Notification chime ON (Click to mute)' : 'Notification chime OFF (Click to turn on)'}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sound ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Muted</span>
                  </>
                )}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto text-[11px] no-scrollbar">
            {(['all', 'review', 'renewal', 'complaint', 'violation'] as const).map(type => {
              const labelMap: Record<string, string> = {
                all: `All (${notifications.length})`,
                review: `Reviews (${notifications.filter(n => n.type === 'review').length})`,
                renewal: `Renewals (${notifications.filter(n => n.type === 'renewal').length})`,
                complaint: `Complaints (${notifications.filter(n => n.type === 'complaint').length})`,
                violation: `Citations (${notifications.filter(n => n.type === 'violation').length})`,
              };
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                    filterType === type
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  {labelMap[type]}
                </button>
              );
            })}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No pending alerts requiring attention.</p>
              </div>
            ) : (
              filteredNotifications.map(item => {
                const isRead = readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3 transition-colors cursor-pointer flex items-start space-x-3 hover:bg-slate-50 ${
                      !isRead ? 'bg-emerald-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Icon based on notification type */}
                    <div className="shrink-0 mt-0.5">
                      {item.type === 'review' && (
                        <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200">
                          <FileCheck2 className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'renewal' && (
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'complaint' && (
                        <div className="p-2 rounded-xl bg-rose-100 text-rose-700 border border-rose-200">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'violation' && (
                        <div className="p-2 rounded-xl bg-orange-100 text-orange-700 border border-orange-200">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          {item.vehicleCategory && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                              item.vehicleCategory === 'Pedicab'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {item.vehicleCategory}
                            </span>
                          )}
                          {item.plateOrMtop && (
                            <span className="text-[10px] font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded">
                              {item.plateOrMtop}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {item.date}
                        </span>
                      </div>

                      <h5 className="text-xs font-bold text-slate-900 mt-1 truncate">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 self-center" />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-3">
            <span className="text-[10px] text-slate-400">
              Live updates with sound
            </span>
            <button
              type="button"
              onClick={playNotificationChime}
              className="text-[10px] font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
            >
              Test Chime
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
