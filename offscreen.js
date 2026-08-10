// Track in-flight playbacks so the offscreen document can close itself once
// it goes idle. A lingering offscreen document is what makes Chrome show the
// persistent "background document" (camera-like) indicator on the extension.
let activePlays = 0;
let closeTimer = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.target === "offscreen" && message.type === "PLAY_SIGNAL") {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    activePlays += 1;

    playSignal(message.kind, message.theme)
      .catch(console.error)
      .finally(() => {
        activePlays = Math.max(0, activePlays - 1);
        if (activePlays === 0) {
          if (closeTimer) clearTimeout(closeTimer);
          // Small grace period in case another signal follows immediately.
          closeTimer = setTimeout(requestClose, 1000);
        }
      });
  }
});

function requestClose() {
  if (activePlays > 0) return;
  try {
    chrome.runtime.sendMessage({ type: "CLOSE_OFFSCREEN" });
  } catch (error) {
    // Service worker will reclaim the document eventually.
  }
}

/*
 * Warm, expressive signal tones.
 *
 * Each signal is a short melodic phrase rather than a string of hard beeps:
 *  - notes overlap (legato) so the phrase flows instead of stuttering,
 *  - a soft attack + long release keeps every note from clicking,
 *  - a gentle low-pass filter tames the highs so nothing is piercing,
 *  - an optional detuned twin + soft octave add warmth and body,
 *  - a light compressor keeps overlapping notes from clipping.
 */
const themes = {
  bright: {
    wave: "sine",
    gain: 0.20,
    cutoff: 2600,
    step: 0.15,
    noteDur: 0.5,
    release: 0.4,
    detune: 4,
    octave: true,
    shimmer: false,
    sequences: {
      startWork: [523.25, 659.25, 783.99, 1046.5],
      finishWork: [1046.5, 783.99, 659.25, 523.25],
      startBreak: [587.33, 783.99, 987.77],
      warning: [880, 1174.66],
      pause: [659.25, 523.25],
      reset: [587.33, 440, 329.63]
    }
  },
  arcade: {
    wave: "triangle",
    gain: 0.17,
    cutoff: 2100,
    step: 0.12,
    noteDur: 0.34,
    release: 0.26,
    detune: 6,
    octave: true,
    shimmer: false,
    sequences: {
      startWork: [523.25, 783.99, 1046.5, 1567.98],
      finishWork: [1567.98, 1046.5, 783.99, 523.25],
      startBreak: [659.25, 880, 1318.51],
      warning: [1046.5, 1318.51],
      pause: [783.99, 523.25],
      reset: [659.25, 440]
    }
  },
  bell: {
    wave: "sine",
    gain: 0.19,
    cutoff: 3400,
    step: 0.17,
    noteDur: 0.8,
    release: 0.8,
    detune: 2,
    octave: true,
    shimmer: true,
    sequences: {
      startWork: [880, 1318.51, 1760],
      finishWork: [1760, 1318.51, 880],
      startBreak: [659.25, 987.77, 1318.51],
      warning: [1318.51, 1760],
      pause: [880, 659.25],
      reset: [659.25, 493.88, 392]
    }
  },
  soft: {
    wave: "sine",
    gain: 0.15,
    cutoff: 1500,
    step: 0.2,
    noteDur: 0.7,
    release: 0.6,
    detune: 3,
    octave: false,
    shimmer: false,
    sequences: {
      startWork: [392, 523.25, 659.25],
      finishWork: [659.25, 523.25, 392],
      startBreak: [440, 587.33, 698.46],
      warning: [587.33, 698.46],
      pause: [523.25, 392],
      reset: [392, 293.66]
    }
  }
};

async function playSignal(kind = "warning", themeName = "bright") {
  const context = new AudioContext();
  const theme = themes[themeName] || themes.bright;
  const notes = theme.sequences[kind] || theme.sequences.warning;

  const master = context.createGain();
  master.gain.value = 0.9;

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = theme.cutoff;
  filter.Q.value = 0.6;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 20;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.25;

  master.connect(filter);
  filter.connect(compressor);
  compressor.connect(context.destination);

  const start = context.currentTime + 0.04;

  notes.forEach((frequency, index) => {
    playVoice(context, master, frequency, start + index * theme.step, theme);
  });

  const tail = start + notes.length * theme.step + theme.noteDur + theme.release + 0.12;
  await sleep((tail - context.currentTime) * 1000 + 60);
  await context.close();
}

function playVoice(context, destination, frequency, at, theme) {
  const envelope = context.createGain();
  envelope.connect(destination);

  const oscillator = context.createOscillator();
  oscillator.type = theme.wave;
  oscillator.frequency.value = frequency;
  oscillator.connect(envelope);

  const voices = [oscillator];

  // A slightly detuned twin adds gentle warmth/chorus.
  if (theme.detune) {
    const twin = context.createOscillator();
    twin.type = theme.wave;
    twin.frequency.value = frequency;
    twin.detune.value = theme.detune;

    const twinGain = context.createGain();
    twinGain.gain.value = 0.5;
    twin.connect(twinGain);
    twinGain.connect(envelope);
    voices.push(twin);
  }

  // A soft octave above gives the tone body / a bell-like shimmer.
  if (theme.octave) {
    const octave = context.createOscillator();
    octave.type = theme.wave;
    octave.frequency.value = frequency * 2;

    const octaveGain = context.createGain();
    octaveGain.gain.value = theme.shimmer ? 0.28 : 0.16;
    octave.connect(octaveGain);
    octaveGain.connect(envelope);
    voices.push(octave);
  }

  const peak = theme.gain;
  const attack = 0.018;
  const end = at + theme.noteDur + theme.release;

  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(peak, at + attack);
  envelope.gain.exponentialRampToValueAtTime(peak * 0.55, at + theme.noteDur * 0.5);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);

  for (const voice of voices) {
    voice.start(at);
    voice.stop(end + 0.03);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
