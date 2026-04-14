'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';

const SCHEDULE = [
  {
    day: 'Day 1',
    date: 'TBD',
    events: [
      { time: '08:00 AM', title: 'Delegate Registration & Check-In', location: 'Main Lobby', type: 'admin' },
      { time: '09:30 AM', title: 'Inauguration Ceremony', location: 'Main Auditorium', type: 'plenary' },
      { time: '11:00 AM', title: 'Committee Session 1', location: 'Committee Rooms', type: 'committee' },
      { time: '01:00 PM', title: 'Lunch Break', location: 'Dining Hall', type: 'break' },
      { time: '02:30 PM', title: 'Committee Session 2', location: 'Committee Rooms', type: 'committee' },
      { time: '05:00 PM', title: 'Evening Reception', location: 'Rooftop', type: 'social' },
    ]
  },
  {
    day: 'Day 2',
    date: 'TBD',
    events: [
      { time: '09:00 AM', title: 'Committee Session 3', location: 'Committee Rooms', type: 'committee' },
      { time: '11:30 AM', title: 'Unmoderated Caucus & Lobbying', location: 'Common Areas', type: 'committee' },
      { time: '01:00 PM', title: 'Lunch Break', location: 'Dining Hall', type: 'break' },
      { time: '02:30 PM', title: 'Committee Session 4 — Voting', location: 'Committee Rooms', type: 'committee' },
      { time: '05:30 PM', title: 'Closing Ceremony & Awards', location: 'Main Auditorium', type: 'plenary' },
      { time: '07:00 PM', title: 'Funology Carnival & Sundowner', location: 'Event Grounds', type: 'social' },
    ]
  }
];

const typeColors: Record<string, string> = {
  admin: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  plenary: 'bg-gold/10 border-gold/30 text-gold',
  committee: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  break: 'bg-green-500/10 border-green-500/30 text-green-400',
  social: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
};

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-charcoal-dark py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-gold text-sm font-montserrat transition-colors">
            <ArrowLeft size={14} />
            Dashboard
          </Link>
        </div>

        <div className="text-center mb-10">
          <p className="text-gold/60 font-montserrat text-xs tracking-[5px] uppercase mb-2">YDS 2026</p>
          <h1 className="font-anton text-4xl text-cream tracking-wider">CONFERENCE SCHEDULE</h1>
        </div>

        {SCHEDULE.map((day, di) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: di * 0.15 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gold text-charcoal-dark font-impact px-4 py-1.5 rounded-xl text-lg tracking-wider">
                {day.day}
              </div>
              <span className="text-white/30 font-montserrat text-sm">{day.date}</span>
            </div>

            <div className="space-y-3">
              {day.events.map((event, ei) => (
                <motion.div
                  key={ei}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: di * 0.15 + ei * 0.05 }}
                  className="yuva-card p-4 flex items-center gap-4"
                >
                  <div className="w-20 flex-shrink-0">
                    <div className="flex items-center gap-1 text-white/40">
                      <Clock size={11} />
                      <span className="font-montserrat text-xs">{event.time}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-montserrat font-600 text-cream text-sm">{event.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-white/30" />
                      <span className="font-montserrat text-xs text-white/40">{event.location}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-montserrat px-2.5 py-1 rounded-lg border ${typeColors[event.type]}`}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
