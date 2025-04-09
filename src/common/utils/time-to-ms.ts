export function timeToMs(time: string): number {
  if (typeof time !== 'string' || !time) return 0;

  const fullDayMs = 24 * 60 * 60 * 1000;
  const offset = time.match(/([+-])([0-1][0-9]|2[0-3]):?([0-5][0-9])?$/);

  let timeWithoutOffset = time;

  let msOffset = 0;
  if (offset) {
    const [_, sign, hOffset, mOffset = '0'] = offset;

    msOffset = (Number(hOffset) * 60 * 60 + Number(mOffset) * 60) * 1000;
    msOffset = sign === '+' ? 0 - msOffset : msOffset; // convert to UTC Time

    timeWithoutOffset = time.slice(0, time.indexOf(sign));
  } else {
    timeWithoutOffset = timeWithoutOffset.replace(/[zZ]/g, '');
  }

  const [hms, msStr = '0'] = timeWithoutOffset.split('.');

  let milliseconds = Number(msStr.substring(0, 3).padEnd(3, '0'));
  milliseconds = !isNaN(milliseconds) ? milliseconds : 0;

  const [hours, minutes, seconds] = hms.split(':').map(Number);
  milliseconds += (hours * 60 * 60 + minutes * 60 + seconds) * 1000;

  const totalMs = milliseconds + msOffset;
  if (totalMs < 0) return fullDayMs + totalMs;

  return totalMs >= fullDayMs ? totalMs % fullDayMs : totalMs;
}
