#!/usr/bin/env python3
"""
Model Speed & Latency Benchmark Script for Cowork PC Agent.
Benchmarks Local Ollama models (Llama / Qwen) and Google Gemini API.
Measures:
- Cold Start vs Warm Latency (ms)
- Tokens Per Second (eval_rate)
- Load Duration (disk-to-RAM time)
"""

import sys
import time
import json
import urllib.request
import urllib.error

OLLAMA_URL = "http://127.0.0.1:11434"
DEFAULT_MODEL = "qwen2.5:3b"

def benchmark_ollama(model_name: str = DEFAULT_MODEL, runs: int = 2):
    print("\n" + "=" * 60)
    print(f"  BENCHMARKING LOCAL OLLAMA: {model_name}")
    print(f"  Endpoint: {OLLAMA_URL}")
    print("=" * 60)

    # 1. Check if Ollama is online
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags")
        with urllib.request.urlopen(req, timeout=3) as response:
            tags = json.loads(response.read().decode())
            available = [m.get("name", "") for m in tags.get("models", [])]
            print(f"[OK] Ollama is online. Installed models: {available}")
            if not any(model_name in m for m in available):
                print(f"[WARN] '{model_name}' not in list. Available: {available}")
    except Exception as e:
        print(f"[ERROR] Cannot reach Ollama at {OLLAMA_URL}.")
        print("Make sure 'ollama serve' is running in another terminal window.")
        return

    # 2. Benchmark runs
    test_prompt = "Explain in exactly 2 sentences what an autonomous computer-use agent is."
    print(f"\nTest Prompt: \"{test_prompt}\"\n")

    for i in range(1, runs + 1):
        run_type = "Cold Run (Includes disk load)" if i == 1 else "Warm Run (Cached in RAM)"
        print(f"--- Run {i} / {runs}: {run_type} ---")

        payload = json.dumps({
            "model": model_name,
            "prompt": test_prompt,
            "stream": False
        }).encode("utf-8")

        start_time = time.perf_counter()
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = json.loads(resp.read().decode())
                elapsed_ms = (time.perf_counter() - start_time) * 1000

                # Extract Ollama hardware telemetry
                total_dur_ms = raw.get("total_duration", 0) / 1e6
                load_dur_ms = raw.get("load_duration", 0) / 1e6
                eval_count = raw.get("eval_count", 0)
                eval_dur_ms = raw.get("eval_duration", 0) / 1e6

                tokens_per_sec = (eval_count / (eval_dur_ms / 1000)) if eval_dur_ms > 0 else 0

                print(f"  Response: {raw.get('response', '').strip()}")
                print(f"  Roundtrip Latency   : {elapsed_ms:.1f} ms ({elapsed_ms/1000:.2f} s)")
                if load_dur_ms > 0:
                    print(f"  Model Load Time     : {load_dur_ms:.1f} ms (Disk -> RAM)")
                print(f"  Tokens Generated    : {eval_count} tokens")
                print(f"  Generation Speed    : {tokens_per_sec:.2f} tokens/second")
                print("-" * 50)

        except Exception as e:
            print(f"  [FAIL] Request failed: {e}")

def main():
    target_model = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_MODEL
    benchmark_ollama(target_model, runs=2)
    print("\nBenchmark completed.\n")

if __name__ == "__main__":
    main()
