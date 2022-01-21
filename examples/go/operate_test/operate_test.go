package operate_test
import "testing"

const (
    Readable = 1 << iota
    Writeable
    Executable
)

func TestBitClear(t *testing.T) {
	t.Log(Executable)
	a := 7
	a = a &^ Executable
	t.Log(a & Readable == Readable, a & Writeable == Writeable, a & Executable == Executable)
}