# Finds the beat grid of the reel's music (from the start offset used in the reel) -> reels/virat-beats.json
import json, subprocess, numpy as np
SRC, START, DUR, SR = 'public/audio/experience.mp3', 89.0, 126.0, 22050
raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', str(START), '-t', str(DUR), '-i', SRC, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'])
x = np.frombuffer(raw, np.float32)
H, N = 512, 2048
fr = np.lib.stride_tricks.sliding_window_view(x, N)[::H] * np.hanning(N)
S = np.log1p(np.abs(np.fft.rfft(fr, axis=1)))
flux = np.maximum(0, np.diff(S, axis=0)).sum(1); flux = (flux - flux.mean()) / flux.std()
fps = SR / H
# tempo by autocorrelation between 60 and 160 bpm
ac = np.correlate(flux, flux, 'full')[len(flux) - 1:]
lags = np.arange(int(fps * 60 / 160), int(fps * 60 / 60))
lag = lags[np.argmax(ac[lags])]; period = lag / fps
# phase that lands the grid on the strongest onsets
best = max(range(lag), key=lambda p: flux[p::lag].sum())
grid = np.arange(best / fps, DUR, period)
# refine each beat to the local onset peak (+-60ms)
w = int(0.06 * fps); beats = []
for b in grid:
    i = int(b * fps); a, c = max(0, i - w), min(len(flux), i + w + 1)
    beats.append(round((a + int(np.argmax(flux[a:c]))) / fps, 3))
json.dump({'bpm': round(60 / period, 1), 'beats': beats}, open('reels/virat-beats.json', 'w'))
print('bpm', round(60 / period, 1), 'beats', len(beats), beats[:8])
