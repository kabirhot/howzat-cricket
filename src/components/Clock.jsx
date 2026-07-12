import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon, Globe } from 'lucide-react';

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeZones = [
    { name: 'New York', zone: 'America/New_York', emoji: '🗽' },
    { name: 'London', zone: 'Europe/London', emoji: '🇬🇧' },
    { name: 'Tokyo', zone: 'Asia/Tokyo', emoji: '🗾' },
    { name: 'Sydney', zone: 'Australia/Sydney', emoji: '🦘' },
    { name: 'Dubai', zone: 'Asia/Dubai', emoji: '🏜️' },
    { name: 'Singapore', zone: 'Asia/Singapore', emoji: '🏙️' },
    { name: 'São Paulo', zone: 'America/Sao_Paulo', emoji: '🇧🇷' },
    { name: 'Mumbai', zone: 'Asia/Kolkata', emoji: '🇮🇳' },
  ];

  const getTimeInZone = (zone) => {
    return time.toLocaleString('en-US', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getDateInZone = (zone) => {
    return time.toLocaleString('en-US', {
      timeZone: zone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6 md:p-12">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-2">
          <ClockIcon className="w-8 h-8 text-lime-400" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Global Time Zone Clock
          </h1>
        </div>
        <p className="text-slate-400 text-lg">
          Real-time display across major cities worldwide
        </p>
      </div>

      {/* Main Clock Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {timeZones.map((tz) => (
          <div
            key={tz.zone}
            className="group glass-panel border border-slate-800 rounded-3xl p-6 hover:border-lime-400/50 transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-950/80 hover:from-slate-900 hover:to-slate-900/90"
          >
            {/* Glow effect on hover */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-lime-400/10 rounded-full blur-3xl group-hover:bg-lime-400/20 transition duration-300"></div>

            <div className="relative z-10">
              {/* City Info */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">{tz.emoji}</span>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{tz.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{tz.zone}</p>
                </div>
              </div>

              {/* Time Display */}
              <div className="space-y-2">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
                  <div className="text-4xl font-black text-lime-400 font-mono tracking-wider">
                    {getTimeInZone(tz.zone)}
                  </div>
                  <div className="text-xs text-slate-400 mt-2 font-semibold">
                    {getDateInZone(tz.zone)}
                  </div>
                </div>

                {/* UTC Offset */}
                <div className="text-xs text-slate-500 text-center font-mono">
                  UTC {new Date().toLocaleString('en-US', { timeZone: tz.zone, timeZoneName: 'short' }).split(' ').pop()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="max-w-6xl mx-auto mt-12">
        <div className="glass-panel border border-slate-800 rounded-2xl p-6 bg-gradient-to-r from-slate-900/50 to-slate-950/50">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-lime-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-slate-100 mb-1">Time Zone Coverage</h4>
              <p className="text-sm text-slate-400">
                This clock displays real-time across 8 major time zones covering all continents. Times update every second to show accurate local time in each city.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Clock;
