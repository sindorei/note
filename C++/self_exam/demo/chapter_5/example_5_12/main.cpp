//
// Created by sindorei on 2019/6/29.
//

#include <iostream>
using namespace std;


class  A {
    private:
        int val;
    public:
        A(int i) { val = i; }
        int value(int a) { return val + a; }
};

int main() {
    int(A::*pfun) (int);
    pfun = &A::value;
    A obj(10);
    cout << (obj.*pfun)(15) << endl;
    A *pc = &obj;
    cout << (pc->*pfun)(15) << endl;
}
