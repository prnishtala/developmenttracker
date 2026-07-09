import { DateTime } from 'luxon';
import { RampConfig } from './types';
import { TZ, fromMinutes, label12h, toMinutes } from './time';

/**
 * Bedtime ramp helper. The plan shifts bedtime 15 min earlier every 3–4 nights
 * from a late start toward an end-state target, and asks "is lights-out reliably
 * before X yet?" A moving cue beats a fixed finish line, so this computes the
 * target for *tonight* from the ramp's start.
 */
export function targetBedtimeFor(config: RampConfig, dateISO: string): string {
  const start = DateTime.fromISO(config.startDate, { zone: TZ }).startOf('day');
  const day = DateTime.fromISO(dateISO, { zone: TZ }).startOf('day');
  const nights = Math.max(0, Math.floor(day.diff(start, 'days').days));
  const steps = Math.floor(nights / Math.max(1, config.stepDays));

  let startMin = toMinutes(config.startTime);
  let targetMin = toMinutes(config.targetTime);
  // Bedtimes after midnight (e.g. 2:00 AM) sit "after" the 11:30 PM target on a
  // wrapped clock; normalise both onto an evening axis so subtraction is linear.
  if (startMin < 12 * 60) startMin += 24 * 60;
  if (targetMin < 12 * 60) targetMin += 24 * 60;

  const shifted = startMin - steps * config.stepMinutes;
  const clamped = Math.max(targetMin, shifted);
  return fromMinutes(clamped);
}

export function rampStatus(config: RampConfig, dateISO: string): {
  target: string;
  targetLabel: string;
  done: boolean;
} {
  const target = targetBedtimeFor(config, dateISO);
  let t = toMinutes(target);
  let goal = toMinutes(config.targetTime);
  if (t < 12 * 60) t += 24 * 60;
  if (goal < 12 * 60) goal += 24 * 60;
  return { target, targetLabel: label12h(target), done: t <= goal };
}
