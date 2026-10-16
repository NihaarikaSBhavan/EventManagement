import { TODAY } from '@/lib/dates';
import { activeReadiness, countdownLabel, eventPhase, eventReadiness, needsAttention, wrapUpChecklist } from './readiness';
import { createSeed } from './seed';

const data = createSeed();
const ev = (code: string) => data.events.find((e) => e.code === code)!;
const check = (code: string, key: string) => eventReadiness(data, ev(code), TODAY).checks.find((c) => c.key === key)!;

describe('event phase & countdown', () => {
  it('knows the summit is live and the gala is preparing', () => {
    expect(eventPhase(ev('EV-2026-CHE01'), TODAY)).toBe('Live');
    expect(countdownLabel(ev('EV-2026-CHE01'), TODAY)).toBe('Live · day 3 of 4');
    expect(eventPhase(ev('EV-2026-BLR02'), TODAY)).toBe('Preparing');
    expect(countdownLabel(ev('EV-2026-BLR02'), TODAY)).toBe('Load-in in 7 days');
  });
});

describe('readiness checks', () => {
  it('blocks job orders that are past due', () => {
    expect(check('EV-2026-KOC05', 'jobs').level).toBe('blocked');
  });
  it('blocks a permit past its due date', () => {
    const v = check('EV-2026-KOC05', 'vendors');
    expect(v.level).toBe('blocked');
    expect(v.summary).toBe('1 of 3 confirmed');
  });
  it('blocks overdue client invoices', () => {
    expect(check('EV-2026-HYD03', 'money').level).toBe('blocked');
  });
  it('blocks an unpaid fabrication advance within 7 days of load-in', () => {
    const m = check('EV-2026-BLR02', 'money');
    expect(m.level).toBe('blocked');
    expect(m.blockers[0].title).toMatch(/Fabrication Advance unpaid with load-in in 7 days/);
  });
  it('flags events with nothing booked', () => {
    expect(check('EV-2026-MDU07', 'vendors').level).toBe('attention');
    expect(check('EV-2026-MDU07', 'jobs').summary).toBe('None created yet');
  });
  it('shows gear shortfall when requested exceeds reserved', () => {
    const d = createSeed();
    d.jobs[3] = { ...d.jobs[3], requested: [{ itemId: 'INV-08', qty: 200 }] };
    const g = eventReadiness(d, d.events.find((e) => e.code === 'EV-2026-HYD03')!, TODAY).checks.find((c) => c.key === 'gear')!;
    expect(g.level).toBe('blocked');
    expect(g.blockers[0].title).toBe('Short 20 × Octanorm booth');
  });
  it('treats an open site issue as a blocker', () => {
    expect(eventReadiness(data, ev('EV-2026-CHE01'), TODAY).blockers[0].check).toBe('issue');
  });
});

describe('needs attention queue', () => {
  it('ranks blocked items before attention items and excludes completed events', () => {
    const list = activeReadiness(data, TODAY);
    expect(list.some((r) => r.event.code === 'EV-2026-CHE06')).toBe(false);
    const q = needsAttention(list);
    const firstAttention = q.findIndex((b) => b.level === 'attention');
    expect(q.slice(firstAttention).every((b) => b.level === 'attention')).toBe(true);
  });
});

describe('wrap-up', () => {
  it('only lacks client feedback for the completed retreat', () => {
    const items = wrapUpChecklist(data, ev('EV-2026-CHE06'));
    expect(items.filter((i) => !i.done).map((i) => i.key)).toEqual(['feedback']);
  });
});
