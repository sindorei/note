class Test {
        int num;
        double fl;
    public:
        Test(int n) {
            num = n;
        }
        Test(int n, double f) {
            num = n;
            fl = f;
        }
        int GetNum() {
            return num;
        }
        double GetF() {
            return fl;
        }
};

#include <iostream>
using  namespace std;

int main() {
    Test one[2] = { 2, 4}, *p;
    Test two[2] = { Test(1, 3.2), Test(5, 9.5)};
    for (int i = 0; i < 2; i++) {
        cout << "one[" << i << "]=" << one[i].GetNum() << endl;
    }
    p = two;
    for (int i = 0; i < 2; i++, p++) {
        cout << "tow[" << i << "]=(" << p -> GetNum() << ","
                                                      << p -> GetF() << ")" << endl;
    }
}

/*
 * 使用类对象数组和指针
 * 运行结果
 * one[0]=2
    one[1]=4
    tow[0]=(1,3.2)
    tow[1]=(5,9.5)
 *
 * */