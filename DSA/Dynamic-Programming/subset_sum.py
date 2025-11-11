# https://www.geeksforgeeks.org/problems/subset-sum-problem-1611555638/1

# Given an array of positive integers arr[] and a value sum,
# determine if there is a subset of arr[] with sum equal to given sum.

'''
Example:

Input: arr[] = [3, 34, 4, 12, 5, 2], sum = 9
Output: true
Explanation: Here there exists a subset with target sum = 9, 4+3+2 = 9.
'''


def is_subset_sum(arr, target_sum):
    n = len(arr)
    # Create a 2D array to store results of subproblems
    dp = [[False for _ in range(target_sum + 1)] for _ in range(n + 1)]

    # If sum is 0, then answer is true (empty subset)
    for i in range(n + 1):
        dp[i][0] = True

    # Fill the subset table in a bottom-up manner
    for i in range(1, n + 1):
        for j in range(1, target_sum + 1):
            if arr[i - 1] <= j:
                dp[i][j] = dp[i - 1][j] or dp[i - 1][j - arr[i - 1]]
            else:
                dp[i][j] = dp[i - 1][j]

    return dp[n][target_sum]
