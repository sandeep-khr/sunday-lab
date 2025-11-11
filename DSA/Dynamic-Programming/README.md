# Dynamic Programming (DP)
- **recursion** with **memoization** (or tabulation) to optimize the solution and avoid redundant calculations

recursion with memoization

DP = Enhanced Recursion
- Parent of DP is recursion
- DP asks for optimal solution
- Choice/choose  -> recursion can be applied

- Recursive + storage

```
Recursive function -> Memoization (Top-Down) -> Tabulation (Bottom-Up)
```

## Variations in DP problems (79)

1. **0-1 Knapsack Problem** (6 types)
2. **Unbounded Knapsack Problem** (5 types)
3. **Fibonacci Sequence** (7 variations)
4. **Longest Common Subsequence** (15 types)
5. **Longest Increasing Subsequence** (10 types)
6. **Kadane’s Algorithm** (6 variations)
7. **Matrix Chain Multiplication** (7 variations)
8. **DP on Trees** (4 types)
9. **DP on Matrices** (14 variations)
10. **Others** (5 types)

### 0-1 Knapsack problem

**optimizing a choice** when you can either include or exclude an item in a knapsack without exceeding its weight limit.

1. **Subset Sum** – Check if there is a subset with a given sum.
2. **Equal Sum Partition** – Divide a set into two subsets with equal sum.
3. **Count of Subset Sum** – Find the number of subsets that sum to a specific value.
4. **Minimum Subset Sum Difference** – Find the minimum difference between the sum of two subsets.
5. **Target Sum** – Check if a target sum can be reached with given numbers.
6. **Number of Subsets with Given Difference** – Count subsets with a specific difference in sum.

```python
# 0-1 Knapsack Problem - Recursive Approach
def knapsack_recursive(weights: List[int], values: List[int], W: int, n: int) -> int:
    # Base case: If no items left or no capacity in the knapsack
    if n == 0 or W == 0:
        return 0
    
    # If the weight of the current item is more than the remaining capacity, skip it
    if weights[n-1] > W:
        return knapsack_recursive(weights, values, W, n-1)

    # Return the maximum of two cases:
    # 1. Exclude the current item
    # 2. Include the current item and reduce the capacity and items
    else:
        return max(
            knapsack_recursive(weights, values, W, n-1),  # Exclude current item
            values[n-1] + knapsack_recursive(weights, values, W - weights[n-1], n-1)  # Include current item
        )
```
#### Time Complexity:
- **Time Complexity**: \( O(2^n) \), because we explore every possible combination of items (including or excluding each item)
- **Space Complexity**: \( O(n) \), due to the recursion call stack, as the maximum recursion depth is `n`.


```python
# 0-1 Knapsack Problem - Memoization (Top-Down DP)

def knapsack_memoization(weights: List[int], values: List[int], W: int, n: int, memo: List[List[int]]) -> int:
    # Base case: If no items left or no capacity in the knapsack
    if n == 0 or W == 0:
        return 0
    
    # Check if the result has already been computed
    if (n, W) in memo:
        return memo[(n, W)]
    
    # If the weight of the current item is more than the remaining capacity, skip it
    if weights[n-1] > W:
        memo[(n, W)] = knapsack_memoization(weights, values, W, n-1, memo)
    else:
        # Otherwise, calculate the max value by either including or excluding the current item
        memo[(n, W)] = max(
            knapsack_memoization(weights, values, W, n-1, memo),  # Exclude current item
            values[n-1] + knapsack_memoization(weights, values, W - weights[n-1], n-1, memo)  # Include current item
        )
    
    return memo[(n, W)]
```

#### Time Complexity:
- **Time Complexity**: \( O(n \times W) \). solution to each subproblem is computed only once and stored. We are computing the result for each pair `(n, W)` only once. There are `n` items and `W` capacities, so the total number of subproblems is \( n \times W \).
- **Space Complexity**: \( O(n \times W) \), for storing the memoization table (which contains the results of subproblems). Additionally, the recursion call stack contributes \( O(n) \), so overall space complexity is \( O(n \times W) \).

---


```python
# 0-1 Knapsack Problem - Tabulation (Bottom-Up) Approach

def knapsack_tabulation(weights: List[int], values: List[int], W: int) -> int:
    n = len(weights)
    
    # DP table where dp[i][w] stores the maximum value for first i items and weight w
    dp = [[0 for _ in range(W + 1)] for _ in range(n + 1)]
    
    # Build the table in bottom-up manner
    for i in range(1, n + 1):  # Iterate over all items
        for w in range(1, W + 1):  # Iterate over all capacities from 1 to W
            if weights[i-1] <= w:
                # If we can include the current item, take the max of:
                # 1. Exclude the item (dp[i-1][w])
                # 2. Include the item (values[i-1] + dp[i-1][w - weights[i-1]])
                dp[i][w] = max(dp[i-1][w], values[i-1] + dp[i-1][w - weights[i-1]])
            else:
                # If we can't include the current item, just exclude it
                dp[i][w] = dp[i-1][w]
    
    # The last cell of the table will have the maximum value
    return dp[n][W]
```

#### Time Complexity:
- **Time Complexity**: \( O(n \times W) \), because we need to fill a table of size \( n \times W \). For each cell, we perform constant-time operations (a comparison and a max operation).
- **Space Complexity**: \( O(n \times W) \), because we store the results of all subproblems in a 2D table of size \( n \times W \).


### Summary:

| **Approach**      | **Time Complexity**     | **Space Complexity**    |
|-------------------|-------------------------|-------------------------|
| **Recursive**     | \( O(2^n) \)            | \( O(n) \)              |
| **Memoization**   | \( O(n \times W) \)     | \( O(n \times W) \)     |
| **Tabulation**    | \( O(n \times W) \)     | \( O(n \times W) \)     |

---