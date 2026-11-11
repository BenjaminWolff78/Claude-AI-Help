#!/usr/bin/env python3
"""Render-progress bar feed: the single writer of /home/claude/.render-progress.json.

  progress.py set <stage> [tailMin]   record the current stage (prep / rendering / paused / finishing / done)
  progress.py write                   compose and write the file once
  progress.py loop                    rewrite it every 8 s (run in the background for the whole job)

Inputs:
  STATE  /home/claude/proj/progress_state.json   {stage, tailMin}            (set by `progress.py set`)
  LIVE   /home/claude/proj/render_live.json      {chunkStart, chunkEnd, inChunk, t0, frames, secs}  (written by render_ice.mjs)
  chunks /home/claude/proj/app/out/chunks/c_NNNN.mp4 (96 frames each, the last one shorter)
"""
import json, os, sys, time, glob, datetime

OUT = "/home/claude/.render-progress.json"
STATE = "/home/claude/proj/progress_state.json"
LIVE = "/home/claude/proj/render_live.json"
CHUNKS = "/home/claude/proj/app/out/chunks"
TITLE = "He Covered His Oranges in Ice to Stop Them Freezing"
TOTAL, N = 1924, 96

def rj(p, d):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return d

def compose():
    st = rj(STATE, {"stage": "prep", "tailMin": 30})
    live = rj(LIVE, {})
    done_chunks = sorted(int(os.path.basename(p)[2:6]) for p in glob.glob(os.path.join(CHUNKS, "c_[0-9][0-9][0-9][0-9].mp4")))
    done = sum(min(N, TOTAL - a) for a in done_chunks)
    stage = st.get("stage", "prep")
    in_chunk = 0
    cap = live.get("chunkEnd", min(TOTAL - 1, N - 1))
    if stage == "rendering" and live.get("chunkStart") is not None and live["chunkStart"] not in done_chunks:
        in_chunk = int(live.get("inChunk", 0))
    frames_done = min(TOTAL, done + in_chunk)
    secs, frames = float(live.get("secs", 0) or 0), float(live.get("frames", 0) or 0)
    fpm = round(frames / (secs / 60), 2) if secs > 30 and frames > 0 else float(st.get("fpmGuess", 0) or 0)
    tail = float(st.get("tailMin", 30))
    if stage == "done": eta = 0
    elif stage == "finishing": eta = round(tail * float(st.get("tailLeft", 1.0)), 1)
    else: eta = round((TOTAL - frames_done) / fpm + tail, 1) if fpm > 0 else None
    return {"title": TITLE, "stage": stage, "framesDone": frames_done, "totalFrames": TOTAL, "framesPerMin": fpm,
            "capFrames": int(cap), "tailMin": tail, "etaMin": eta,
            "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")}

def write():
    d = compose(); tmp = OUT + ".tmp"
    with open(tmp, "w") as f: json.dump(d, f)
    os.replace(tmp, OUT); return d

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "write"
    if cmd == "set":
        st = rj(STATE, {}); st["stage"] = sys.argv[2]
        for kv in sys.argv[3:]:
            k, v = kv.split("="); st[k] = float(v)
        with open(STATE, "w") as f: json.dump(st, f)
        print(write())
    elif cmd == "loop":
        while True:
            try: write()
            except Exception as e: print("progress error", e, flush=True)
            time.sleep(8)
    else:
        print(write())
