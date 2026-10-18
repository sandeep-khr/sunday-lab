"""Smallest runnable entrypoint. Uses measured response bank; never invents data."""
import argparse
import json
from pathlib import Path
from environment.task import Config
from training.core import KINDS, experiment, load_bank


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--brain", choices=KINDS, default="connectome")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--episodes", type=int, default=300)
    ap.add_argument("--delay", type=int, choices=[0, 1, 5, 10], default=5)
    ap.add_argument("--immediate", type=float, default=10)
    ap.add_argument("--delayed", type=float, default=100)
    ap.add_argument("--gamma", type=float, default=0.95)
    ap.add_argument("--difficulty", choices=["easy", "medium", "hard"], default="easy")
    ap.add_argument("--no-trace", action="store_true")
    ap.add_argument("--out", default="results/latest.json")
    args = ap.parse_args()
    if args.episodes < 1:
        ap.error("episodes must be positive")
    c = Config(immediate=args.immediate, delayed=args.delayed, delay=args.delay,
               gamma=args.gamma, difficulty=args.difficulty, trace=not args.no_trace)
    result = experiment(load_bank(), args.brain, args.seed, args.episodes, c)
    for i, row in enumerate(result["rows"], 1):
        if i <= 10 or i % 25 == 0:
            print(f"Episode {i:4}  {row['choice']:8}  money={row['money']:6.1f}  discounted_return={row['return']:.2f}")
    print(f"Held-out optimal-choice rate: before={result['before']['success_rate']:.1%} after={result['after']['success_rate']:.1%}")
    print("Source: cached simulations on FlyWire v783. Trained: external readout only.")
    p = Path(args.out)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(result, indent=2))
    print("Saved", p)


if __name__ == "__main__":
    main()
