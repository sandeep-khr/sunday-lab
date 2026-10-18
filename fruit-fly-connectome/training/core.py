"""Small Monte Carlo value readout; matches frontend/dist/engine.js."""
import copy
import hashlib
import json
import math
from pathlib import Path

from environment.task import Config

ROOT = Path(__file__).resolve().parents[1]
KINDS = ("random", "mlp", "fixed", "connectome", "random_network", "disconnected")


class RNG:
    """Mulberry32, shared with JavaScript for cross-runtime reproducibility."""
    def __init__(self, seed):
        self.state = seed & 0xFFFFFFFF

    def random(self):
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = self.state
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


class Readout:
    def __init__(self, kind="connectome", seed=0):
        if kind not in KINDS:
            raise ValueError("Unknown controller")
        self.kind = kind
        self.w = [0.0] * 32
        r = RNG(seed + 101)
        self.a = [[(r.random() - 0.5) * 0.6 for _ in range(2)] for _ in range(8)]
        self.b = [0.0] * 8
        self.v = [0.0] * 8
        self.c = 0.0

    def value(self, x, cue):
        if self.kind == "mlp":
            h = [math.tanh(row[cue] + bias) for row, bias in zip(self.a, self.b)]
            return dot(self.v, h) + self.c
        if self.kind in ("random", "disconnected"):
            return 0.0
        return dot(self.w, x)

    def learn(self, x, cue, target):
        if self.kind in ("random", "fixed", "disconnected"):
            return
        error = target - self.value(x, cue)
        if self.kind == "mlp":
            h = [math.tanh(row[cue] + bias) for row, bias in zip(self.a, self.b)]
            # All 33 MLP parameters may change; not a frozen random-feature layer.
            for j in range(8):
                g = self.v[j] * (1 - h[j] ** 2)
                self.a[j][cue] += 0.08 * error * g
                self.b[j] += 0.08 * error * g
                self.v[j] += 0.08 * error * h[j]
            self.c += 0.08 * error
        else:
            rate = 0.2 / max(dot(x, x), 1e-9)
            self.w = [w + rate * error * f for w, f in zip(self.w, x)]

    def fingerprint(self):
        return hashlib.sha256(json.dumps(self.__dict__, sort_keys=True).encode()).hexdigest()


def load_bank(path=None):
    path = Path(path or ROOT / "frontend/dist/responses.json")
    if not path.exists():
        raise FileNotFoundError("Real response bank missing. Run python -m brain.prepare; no synthetic fallback is used.")
    bank = json.loads(path.read_text())
    if bank.get("source") != "measured_flypoke_response_bank" or not bank.get("validation", {}).get("passed"):
        raise ValueError("A measured, feeding-validated response bank is required.")
    return bank


def episode(bank, model, config, rng, mapping=0, split="train", learn=True):
    key = "random_network" if model.kind == "random_network" else "connectome"
    pool = bank["models"][key]["splits"][split]
    # Draw both observations and payout coins before action: paired exogenous randomness.
    observations = [pool[c][int(rng.random() * len(pool[c]))] for c in range(2)]
    peh_left = rng.random() < 0.5
    cash_draw = [rng.random(), rng.random()]
    values = [model.value(obs["feature"], c) for c, obs in enumerate(observations)]
    epsilon = 0.2 if learn else 0.0
    tie = abs(values[0] - values[1]) < 1e-12
    probability_zero = 0.5 if tie or model.kind == "random" else (1 - epsilon / 2 if values[0] > values[1] else epsilon / 2)
    cue = 0 if rng.random() < probability_zero else 1
    peh = cue == mapping
    outcome = config.outcome(peh, cash_draw[cue])
    if learn and outcome["update"]:
        # Update only when the reward events have arrived. Scale money by 100, fixed across conditions.
        model.learn(observations[cue]["feature"], cue, outcome["learnable_return"] / 100)
    a, b = config.expected(True), config.expected(False)
    optimal = peh if a > b else not peh if b > a else True
    return {"choice": "PEHCHAAN" if peh else "PAISA", "cue": cue,
            "side": "LEFT" if peh == peh_left else "RIGHT", "peh_left": peh_left,
            "probability_pehchaan": probability_zero if mapping == 0 else 1 - probability_zero,
            "optimal": optimal, "expected_regret": max(a, b) - config.expected(peh),
            "money": outcome["money"], "return": outcome["return"], "due": outcome["due"],
            "followers": outcome["followers"], "reputation": outcome["reputation"],
            "events": outcome["events"], "neural_seed": observations[cue]["seed"],
            "active_neurons": observations[cue]["active_neurons"] if model.kind not in ("random", "mlp", "disconnected") else None}


def evaluate(bank, model, config, seed, count=200, mapping=0, split="test"):
    fingerprint = model.fingerprint()
    rng = RNG(seed)
    rows = [episode(bank, model, config, rng, mapping, split, False) for _ in range(count)]
    assert model.fingerprint() == fingerprint, "Evaluation changed learned weights"
    return summarize(rows)


def summarize(rows):
    n = len(rows)
    return {"episodes": n, "success_rate": sum(r["optimal"] for r in rows) / n,
            "pehchaan_rate": sum(r["choice"] == "PEHCHAAN" for r in rows) / n,
            "money_total": sum(r["money"] for r in rows),
            "mean_return": sum(r["return"] for r in rows) / n,
            "mean_regret": sum(r["expected_regret"] for r in rows) / n}


def experiment(bank, kind="connectome", seed=0, episodes=300, config=None, mapping=None):
    config = config or Config()
    mapping = seed % 2 if mapping is None else mapping
    model = Readout(kind, seed)
    before = evaluate(bank, model, config, seed + 10000, mapping=mapping)
    rng = RNG(seed)
    rows = [episode(bank, model, config, rng, mapping) for _ in range(episodes)]
    curve = [{"episode": i, **summarize(rows[max(0, i - 25):i])} for i in range(25, episodes + 1, 25)]
    after = evaluate(bank, model, config, seed + 10000, mapping=mapping)
    transfer = evaluate(bank, model, config, seed + 20000, mapping=mapping, split="transfer")
    return {"kind": kind, "seed": seed, "mapping": mapping, "config": config.to_dict(),
            "before": before, "after": after, "transfer": transfer, "training": summarize(rows),
            "curve": curve, "rows": rows, "model": model.__dict__}
