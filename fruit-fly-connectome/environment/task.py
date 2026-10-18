from dataclasses import asdict, dataclass
import math


@dataclass(frozen=True)
class Config:
    immediate: float = 10.0
    delayed: float = 100.0
    delay: int = 5
    gamma: float = 0.95
    follower_reward: float = 0.0
    reputation_reward: float = 0.0
    difficulty: str = "easy"
    reversal: bool = False
    trace: bool = True

    def __post_init__(self):
        for value in (self.immediate, self.delayed, self.follower_reward, self.reputation_reward):
            if not math.isfinite(value) or not 0 <= value <= 1000:
                raise ValueError("Rewards must be finite and between 0 and 1000.")
        if self.delay not in (0, 1, 5, 10) or not 0 < self.gamma <= 1:
            raise ValueError("Delay must be 0, 1, 5 or 10 ticks; gamma must be in (0, 1].")
        if self.difficulty not in ("easy", "medium", "hard"):
            raise ValueError("Unknown difficulty")

    @property
    def payout_probability(self):
        return {"easy": 1.0, "medium": 0.8, "hard": 0.55}[self.difficulty]

    def expected(self, pehchaan):
        bonus = self.follower_reward + self.reputation_reward if pehchaan else 0
        delayed_branch = pehchaan != self.reversal
        cash = self.delayed * self.gamma ** self.delay if delayed_branch else self.immediate
        return bonus + self.payout_probability * cash

    def outcome(self, pehchaan, draw):
        delayed_branch = pehchaan != self.reversal
        due = self.delay if delayed_branch else 0
        cash = (self.delayed if delayed_branch else self.immediate) if draw < self.payout_probability else 0
        bonus = self.follower_reward + self.reputation_reward if pehchaan else 0
        events = [{"tick": 0, "reward": bonus, "money": 0, "followers": int(pehchaan), "reputation": int(pehchaan)},
                  {"tick": due, "reward": cash, "money": cash, "followers": 0, "reputation": 0}]
        return {"events": events, "money": cash, "followers": int(pehchaan), "reputation": int(pehchaan),
                "due": due, "return": bonus + self.gamma ** due * cash,
                "learnable_return": bonus + (self.gamma ** due * cash if self.trace or due == 0 else 0),
                "update": self.trace or due == 0 or bonus > 0}

    def to_dict(self):
        return asdict(self)
