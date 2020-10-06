package array_test

import "testing"

func TestArray(t *testing.T) {
	a := [...]int {3, 4, 5}
	b := [3]int {4, 5, 6}
	var c [3]int
	c [2] = 1

	t.Log(a, b, c)
}