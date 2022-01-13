package alg

import "testing"

func PositiveIntegerSum(nums []int) int {
	count := len(nums)
	if (count <= 1) return count
	groupMaster = nums[0]

}
func isRp(a int, b int) bool {
	if a == 1 || b == 1 {
		return true
	}
	max := 0
	min := 0
	if a > b {
		max = a
		min = b
	} else {
		max = b
		min = a
	}
	r := max % min
	for r != 0 {
		max = min
		min = r
		r = max % min
	}
	if min > 1 {
		return false
	}
	return true

}

func TestFirst(t *testing.T) {
	t.Log("西西哈")
}
