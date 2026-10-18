"""Run unmodified flypoke and export measured, independently seeded responses.

python -m brain.prepare --trials 16
Run flypoke download first with FLYPOKE_DATA=data/raw.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import platform
import time
from dataclasses import asdict
from pathlib import Path

import numpy as np
import pandas as pd
import scipy.sparse as sp
from flypoke.data import Network, build_network, ANNOTATION_COLUMNS, NT_SIGN
from flypoke.sim import Params, Stimulus, run

ROOT = Path(__file__).resolve().parents[1]
COMMIT = "24814fe83224ca2d25c116c1107440b877b07762"


def load_shiu():
    """Adapt the original authors' public v783 table to flypoke.Network.

    Do not use v630 indexes with v783 annotations. Map exact root IDs, aggregate
    duplicate rows, then threshold at 5 contacts and use annotation NT signs.
    """
    raw = ROOT / "data/raw"
    path = raw / "Connectivity_783.parquet"
    if not path.exists():
        raise FileNotFoundError("Run python -m brain.fetch_data first.")
    neurons = pd.read_csv(raw / "Supplemental_file1_neuron_annotations.tsv", sep="\t",
                          usecols=ANNOTATION_COLUMNS, dtype={"root_id": np.int64}, low_memory=False)
    neurons = neurons.sort_values("root_id").reset_index(drop=True)
    df = pd.read_parquet(path, columns=["Presynaptic_ID", "Postsynaptic_ID", "Connectivity"])
    df = df.groupby(["Presynaptic_ID", "Postsynaptic_ID"], sort=False, as_index=False).Connectivity.sum()
    df = df[df.Connectivity >= 5]
    ix = pd.Index(neurons.root_id)
    pre, post = ix.get_indexer(df.Presynaptic_ID), ix.get_indexer(df.Postsynaptic_ID)
    keep = (pre >= 0) & (post >= 0)
    sign = neurons.top_nt.map(NT_SIGN).fillna(1).to_numpy(dtype=np.float32)
    w = sp.csr_matrix((df.Connectivity.to_numpy()[keep].astype(np.float32) * sign[pre[keep]],
                       (pre[keep], post[keep])), shape=(len(neurons), len(neurons)))
    return Network(neurons, w, 5)


def digest(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def record(net, inputs, seed, rate=150, duration=250):
    rec = run(net, [Stimulus(np.asarray(inputs), rate)],
              Params(t_run=duration), n_trials=1, seed=int(seed))
    return rec, rec.rates(net.n)


def validate(net):
    sugar = net.select("cell_sub_class=sugar/water")
    bitter = net.select("cell_sub_class=bitter")
    # v783 annotation calls these CB0701, not MN9; use upstream's verified IDs.
    mn9 = net.index_of([720575940660219265, 720575940618238523])
    if not all(map(len, [sugar, bitter, mn9])):
        raise ValueError("Annotations do not resolve sugar, bitter and MN9; inspect source version.")
    out = {"source": "FlyWire v783 / flypoke", "mn9_root_ids": net.neurons.iloc[mn9].root_id.astype(str).tolist(),
           "seeds": list(range(3)), "duration_ms": 1000, "stimulus_rate_hz": 150, "conditions": {}}
    for name, groups in [("none", []), ("sugar", [sugar]), ("bitter", [bitter]), ("sugar_bitter", [sugar, bitter])]:
        values = []
        for seed in range(3):
            rec = run(net, [Stimulus(g, 150) for g in groups], Params(), n_trials=1, seed=seed)
            values.append(rec.rates(net.n)[mn9].tolist())
        out["conditions"][name] = values
        print("validation", name, np.mean(values, axis=0).round(2), flush=True)
    c = out["conditions"]
    out["passed"] = bool(np.max(c["none"]) == 0 and np.mean(c["sugar"]) > 10
                         and np.mean(c["sugar_bitter"]) < np.mean(c["sugar"]))
    (ROOT / "results/feeding_validation.json").write_text(json.dumps(out, indent=2))
    if not out["passed"]:
        raise RuntimeError("Feeding validation failed. Do not present this run as validated.")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--trials", type=int, default=16)
    ap.add_argument("--skip-validation", action="store_true")
    args = ap.parse_args()
    if args.trials < 4:
        ap.error("Use at least four independent responses per cue and split.")
    start = time.perf_counter()
    raw = ROOT / "data/raw"
    print("Building FlyWire v783 sparse graph…", flush=True)
    net = load_shiu()
    print(f"{net.n:,} neurons; {net.W.nnz:,} retained directed pairs", flush=True)
    validation = None if args.skip_validation else validate(net)
    sensory = net.select("super_class=sensory,cell_class=olfactory")
    if len(sensory) < 256:
        raise ValueError("Expected at least 256 annotated olfactory sensory neurons.")
    picks = np.random.default_rng(810).permutation(sensory)[:256]
    cues = [picks[:128], picks[128:]]
    shuffled = net.W.copy()
    shuffled.indices = np.random.default_rng(811).permutation(shuffled.indices)
    shuffled.has_sorted_indices = False
    shuffled.sum_duplicates()
    shuffled.sort_indices()
    models = {"connectome": net, "random_network": Network(net.neurons, shuffled, net.min_syn)}
    bank = {"schema": 1, "source": "measured_flypoke_response_bank", "dataset": "FlyWire FAFB v783",
            "simulator_commit": COMMIT, "connectivity_source": "Shiu authors' Connectivity_783.parquet, mapped by root ID; sign from annotation top_nt; minimum 5 contacts after aggregation",
            "neuron_count": net.n, "connection_count": net.W.nnz,
            "params": asdict(Params(t_run=250)), "cue_description": "Two disjoint artificial patterns of 128 olfactory sensory neurons, sampled with seed 810; not natural odours or vision.",
            "cue_root_ids": [net.neurons.iloc[x].root_id.astype(str).tolist() for x in cues],
            "validation": validation, "models": {},
            "randomization": "Permuted CSR targets preserving incoming/outgoing edge-slot counts before duplicate coalescing; signed weight distribution preserved. Not a simple-graph exact-degree null.",
            "files": [{"name": p.name, "sha256": digest(p), "bytes": p.stat().st_size}
                      for p in sorted(raw.glob("*")) if p.name in ("Connectivity_783.parquet", "Supplemental_file1_neuron_annotations.tsv")]}
    for model_name, model in models.items():
        print("Calibrating", model_name, flush=True)
        cal = np.array([record(model, cues[c], 1000 + c * 10 + k)[1] for c in range(2) for k in range(3)])
        cal[:, picks] = 0  # No direct-stimulation bypass in the readout.
        scores = cal.mean(axis=0)
        selected = np.argsort(scores)[-32:][::-1]
        display = np.argsort(scores)[-256:][::-1]
        scale = max(float(cal[:, selected].max()), 1.0)
        rows = model.neurons.iloc[selected].fillna("")
        subgraph = model.W[display][:, display].tocoo()
        entry = {"feature_indices": selected.tolist(), "scale_hz": scale,
                 "display_edges": [[int(i), int(j), float(w)] for i, j, w in zip(subgraph.row, subgraph.col, subgraph.data)],
                 "feature_neurons": [{"root_id": str(r.root_id), "type": str(r.cell_type or r.cell_class),
                                      "class": str(r.super_class), "side": str(r.side)} for r in rows.itertuples()],
                 "display_neurons": [{"root_id": str(model.neurons.iloc[int(i)].root_id),
                                      "class": str(model.neurons.iloc[int(i)].super_class)} for i in display],
                 "connection_count": model.W.nnz, "calibration_active_features": int(np.sum(scores[selected] > 0)),
                 "splits": {}}
        for split, base, rate in [("train", 2000, 150), ("test", 4000, 150), ("transfer", 6000, 120)]:
            sets = [[], []]
            for c in range(2):
                for k in range(args.trials):
                    seed = base + c * 100 + k
                    rec, rates = record(model, cues[c], seed, rate)
                    feature = rates[selected] / scale
                    norm = float(np.linalg.norm(feature))
                    if norm > 0:
                        feature /= norm
                    mask = np.isin(rec.ids, display)
                    pos = {int(v): j for j, v in enumerate(display)}
                    ids, times = rec.ids[mask], rec.times[mask]
                    # Thin recorded events uniformly for drawing; counts remain unthinned.
                    keep = np.arange(0, len(ids), max(1, int(np.ceil(len(ids) / 1200))))
                    sets[c].append({"seed": seed, "cue": c, "feature": feature.round(8).tolist(),
                                    "rates_hz": rates[selected].round(3).tolist(),
                                    "display_rates_hz": rates[display].round(3).tolist(),
                                    "active_neurons": int(np.count_nonzero(rates)), "spikes": int(len(rec.ids)),
                                    "events": [[round(float(times[j]), 2), pos[int(ids[j])]] for j in keep]})
                print(model_name, split, "cue", c, "done", flush=True)
            entry["splits"][split] = sets
        bank["models"][model_name] = entry
    bank["elapsed_seconds"] = time.perf_counter() - start
    bank["platform"] = {"machine": platform.machine(), "python": platform.python_version()}
    target = ROOT / "frontend/dist/responses.json"
    target.write_text(json.dumps(bank, separators=(",", ":")))
    (ROOT / "data/manifest.json").write_text(json.dumps({k: v for k, v in bank.items() if k != "models"}, indent=2))
    print("Saved", target, "in", round(bank["elapsed_seconds"], 2), "seconds", flush=True)


if __name__ == "__main__":
    main()
