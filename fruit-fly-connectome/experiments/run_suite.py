import argparse
import json
import math
import statistics
import time
from dataclasses import replace
from pathlib import Path
from environment.task import Config
from training.core import KINDS, RNG, Readout, episode, evaluate, experiment, load_bank, summarize


def aggregate(runs, field="after"):
    vals = [r[field]["success_rate"] for r in runs]
    sd = statistics.stdev(vals) if len(vals) > 1 else 0
    return {"n_seeds": len(vals), "mean_success": statistics.mean(vals), "sd_success": sd,
            "se_success": sd / math.sqrt(len(vals)),
            "mean_money_per_test": statistics.mean(r[field]["money_total"] / r[field]["episodes"] for r in runs),
            "mean_discounted_return": statistics.mean(r[field]["mean_return"] for r in runs),
            "mean_regret": statistics.mean(r[field]["mean_regret"] for r in runs)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=20)
    ap.add_argument("--episodes", type=int, default=300)
    args = ap.parse_args()
    if args.seeds < 2 or args.episodes < 25:
        ap.error("Use >=2 seeds and >=25 episodes")
    start = time.perf_counter()
    bank = load_bank()
    report = {"source": bank["source"], "dataset": bank["dataset"], "neural_replication": "One anatomy and one randomized graph; learner seeds are not biological replicates.",
              "episodes": args.episodes, "test_episodes": 200, "seeds": list(range(args.seeds)),
              "baselines": {}, "delay_sweep": [], "no_trace": [], "reversal": []}
    for kind in KINDS:
        runs = [experiment(bank, kind, seed, args.episodes) for seed in range(args.seeds)]
        compact = [{k: v for k, v in r.items() if k not in ("rows", "model")} for r in runs]
        report["baselines"][kind] = {"before": aggregate(runs, "before"), "after": aggregate(runs),
                                      "transfer": aggregate(runs, "transfer"), "runs": compact}
        print(kind, report["baselines"][kind]["after"], flush=True)
    for delay in [0, 1, 5, 10]:
        # Near a preference crossover: 25*.85^5 > 10; 25*.85^10 < 10.
        c = Config(delayed=25, delay=delay, gamma=0.85)
        for trace in [True, False]:
            runs = [experiment(bank, "connectome", s, args.episodes, replace(c, trace=trace)) for s in range(args.seeds)]
            report["delay_sweep" if trace else "no_trace"].append({"delay": delay, "config": replace(c, trace=trace).to_dict(),
                   "optimal": "PEHCHAAN" if c.expected(True) > c.expected(False) else "PAISA", "summary": aggregate(runs)})
    for seed in range(args.seeds):
        model, rng = Readout("connectome", seed), RNG(seed)
        mapping = seed % 2
        for _ in range(args.episodes):
            episode(bank, model, Config(), rng, mapping)
        c = Config(reversal=True)
        rows = [episode(bank, model, c, rng, mapping) for _ in range(args.episodes)]
        speed = next((i for i in range(25, len(rows) + 1) if summarize(rows[i-25:i])["success_rate"] >= .8), None)
        report["reversal"].append({"seed": seed, "episodes_to_80_percent_in_25": speed,
                                    "test": evaluate(bank, model, c, seed + 10000, mapping=mapping),
                                    "curve": [{"episode": i, **summarize(rows[i-25:i])} for i in range(25, len(rows)+1,25)]})
    report["elapsed_seconds"] = time.perf_counter() - start
    for p in [Path("results/suite.json"), Path("frontend/dist/suite.json")]:
        p.write_text(json.dumps(report, indent=2))
    print("Suite complete in", report["elapsed_seconds"], "seconds")


if __name__ == "__main__":
    main()
