package two_numbers_add

import "testing"
import "strconv"

// 给出两个 非空 的链表用来表示两个非负的整数。其中，它们各自的位数是按照 逆序 的方式存储的，并且它们的每个节点只能存储 一位 数字。

// 如果，我们将这两个数相加起来，则会返回一个新的链表来表示它们的和。

// 您可以假设除了数字 0 之外，这两个数都不会以 0 开头。

// 示例：

// 输入：(2 -> 4 -> 3) + (5 -> 6 -> 4)
// 输出：7 -> 0 -> 8
// 原因：342 + 465 = 807


type ListNode struct {
	Val int
	Next *ListNode
}

 func addTwoNumbers1(l1 *ListNode, l2 *ListNode) *ListNode {
	 var head *ListNode
	 tail := new (ListNode)
	 head = tail
	 carry := 0
	 for l1 != nil || l2 != nil {
		 v1 := 0
		 v2 := 0
		 if (l1 != nil) {
			 v1 = l1.Val
			 l1 = l1.Next
		 }
		 if (l2 != nil) {
			 v2 = l2.Val
			 l2 = l2.Next
		 }
		 temp := v1 + v2 + carry
		 tail.Val = temp % 10
		 carry = temp / 10
		 if (l1 != nil || l2 != nil) {
			 tail.Next = new (ListNode)
			 tail = tail.Next
		 }
	 }
	 if (carry > 0) {
		 tail.Next = &ListNode {Val: carry}
	 }
	 return head
 }



func TestAddTwoNumber(t * testing.T)  {
	l1 := &ListNode {
		Val: 9,
		Next: &ListNode { Val: 3 , Next: &ListNode { Val: 4} } }

	l2 := &ListNode {
		Val: 5,
		Next: &ListNode { Val: 6}}

	res := addTwoNumbers1(l1, l2)

	str := "["
	for res != nil {
		str += strconv.Itoa(res.Val)
		res = res.Next
		if (res != nil) {
			str += ", "
		}
	}
	str += "]"

	t.Log(str)
	
}