# Decision recorded before implementation — 2026-09-15

Use the inspected MIT-licensed flypoke simulator, pinned to commit
24814fe83224ca2d25c116c1107440b877b07762. Its NumPy/SciPy LIF implementation
accepts a Network and Stimulus and returns actual spike events. Keep it unmodified.
Use public FlyWire v783 data; validate sugar → MN9 and bitter suppression
locally before treating the sensory response bank as usable.

V1 is a two-cue delayed contextual bandit with a fixed neural feature map and a
small learned value readout. Cue responses are computed in Python and cached,
with separate calibration, training, and held-out simulation seeds. The browser
samples those real computed responses and trains its own readout. It does not
run a live whole-brain simulation. All displayed rewards come from actual runs.

One choice precedes each payout; there are no intervening decisions. The external
learner retains the chosen cue feature until reward arrives. This is deliberately
a modest first experiment, not evidence for fly temporal planning or dopamine
physiology. A no-trace control drops that stored feature on delayed trials.

Two equally sized artificial ORN stimulation patterns represent the options.
These are optogenetic-style cues, not visual reading of words or natural odours.
The mapping of patterns to Pehchaan/Paisa and their left/right positions is
counterbalanced. A common value decoder scores both options; the UI movement
is an animation of that explicitly engineered action.

Compare random choice, raw-input MLP, frozen connectome readout, learned
connectome readout, and randomized-connectivity readout. Add disconnected
graph and no-trace controls. No connectome advantage is assumed.

Pehchaan yields one follower and one reputation token, then delayed fictional
money. Paisa yields small immediate fictional money. Follower/reputation reward
weights default to zero, so choosing recognition must be justified by money.
Use a common fixed episode horizon and discounted return to prevent a hidden
reward-per-time advantage for the immediate option. Reverse the money mapping
without changing the sensory representation.

FlyVis is unnecessary for symbolic cues; Flybody physics is unnecessary for two actions.
MaleCNS is background and a future replication dataset, not used in this V1.
Novelty is the presentation and controlled protocol, not connectome-based RL.
Google Scholar and Semantic Scholar direct searches were inaccessible; the
literature search is bounded and cannot establish a first-in-field claim.

## Implementation decisions after the initial audit

The large Zenodo connection download stalled. The implemented adapter instead
uses the original Shiu authors' pinned `Connectivity_783.parquet`, joins exact
root IDs to annotations, aggregates contacts and thresholds at five. The source
and SHA-256 hashes are recorded; byte equivalence with the Zenodo file is not claimed.

The user supplied a 3D fly game reference during implementation. The browser now
uses Flybody's anatomical meshes, converted and simplified with its folded-wing
pose, plus an authored walking animation. MuJoCo resolves geometry during asset
conversion only. Neither its physics nor its locomotion learner runs in the demo.
The controller chooses the destination; the animator supplies the path and gait.
