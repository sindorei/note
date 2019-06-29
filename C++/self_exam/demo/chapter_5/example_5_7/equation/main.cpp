//
// Created by sindorei on 2019/6/29.
//

#include "equation.h"
void Read(float&, float&, float&);

int main() {
    float a, b, c;
    cout << "这是一个求方程 ax2 + bx + c = 0 的根的程序。" << endl;
    for (;;) {
        Read(a, b, c);
        if (a == 0) return 0;
        FindRoot obj(a, b, c);
        obj.Find();
        obj.Display();
    }
}

void Read(float& a, float& b, float& c) {
    cout << "请输入方程式系数a:";
    cin >> a;
    if (a == 0) {
        getchar();
        return;
    }
    cout << "输入方程式系数b:";
    cin >> b;
    cout << "输入方程式系数c:";
    cin >> c;

}
