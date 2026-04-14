import { Audio } from 'expo-av';

let loaded = {};
let enabled = true;

const SOUNDS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
  combo: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
};

async function getSound(key) {
  if (loaded[key]) return loaded[key];
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: SOUNDS[key] },
      { shouldPlay: false, volume: 0.6 },
    );
    loaded[key] = sound;
    return sound;
  } catch {
    return null;
  }
}

async function play(key) {
  if (!enabled) return;
  try {
    const s = await getSound(key);
    if (!s) return;
    await s.setPositionAsync(0);
    await s.playAsync();
  } catch {
    // silently fail on sound errors
  }
}

export function setEnabled(v) { enabled = v; }
export function isEnabled() { return enabled; }

export function playCorrect() { return play('correct'); }
export function playWrong() { return play('wrong'); }
export function playCombo() { return play('combo'); }
export function playLevelUp() { return play('levelUp'); }

export async function preload() {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    await Promise.all(Object.keys(SOUNDS).map(getSound));
  } catch {
    // preload failure is non-critical
  }
}
