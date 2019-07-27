#include <iostream>
#include <iomanip>
using namespace std;

class  iArray {
    int _size;
    int* data;
public:
    iArray(int);
    int& operator[](int);
    int size()const {
        return _size;
    }
    ~iArray() {
        delete []data;
    }
};

iArray::iArray(int n) {
    if (n < 1) {
        cout << "Error dimension description";
        exit(1);
    }
    _size = n;
    data = new int[_size];
}
int& iArray::operator[](int i) {
    if ( i < 0 || i > _size - 1) {
        cout << "\nSubscript out of range";
        delete[]data;
        exit(1);
    }
    return data[i];
}

int main() {
    iArray a(10);
    cout << "数组元素个数=" << a.size() << endl;
    for(int i = 0; i < a.size(); i++) {
        a[i] = 10 * (i + 1);
    }
    for(int i = 0; i < a.size(); i++) {
        cout << setw(5) << a[i];
    }
    return 0;
}