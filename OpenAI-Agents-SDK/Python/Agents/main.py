## Basic Agents
'''
The most common properties of an agent we'll configure are:
- name: A unique identifier for the agent.
- instructions: The instructions for the agent to follow.
- output_type: The type of the output the agent will produce.
- handoffs: A list of agents to hand off the task to.
- input_guardrails: A list of guardrails to apply to the input.
- output_guardrails: A list of guardrails to apply to the output.
- context: A list of context to apply to the agent.
- tools: A list of tools to use.
- model: The model to use.
- temperature: The temperature to use.
'''

from agents import Agent, ModelSettings, function_tool

@function_tool
def get_weather(city: str) -> str:
    return f"The weather in {city} is sunny."

agent = Agent(
    name="Haiku agent",
    instructions="Always respond in haiku form",
    model="gpt-5-nano",
    tools=[get_weather],
)

## Context
'''
Context is a way to pass information to an agent.
It can be used to pass information to an agent, or to pass information to an agent.
We can pass context to an agent by using the context parameter when calling the run method.
We can provide any Python object as context.
'''

from dataclasses import dataclass


@dataclass
class Purchase:
    item: str
    price: float

@dataclass
class UserContext:
    name: str
    uid: str
    is_pro_user: bool

    async def fetch_purchases() -> list[Purchase]:
        return [Purchase(item="Widget", price=10.00), Purchase(item="Gadget", price=20.00)]

agent = Agent[UserContext](
    name="Purchase Agent",
    instructions="You are a purchase agent that can fetch purchases for a user.",
    tools=[UserContext.fetch_purchases],
)

## Output Types
'''

'''