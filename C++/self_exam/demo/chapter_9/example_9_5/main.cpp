#include <iostream>
using namespace std;
class complex {
private:
    double real, imag;
public:
    complex(double r = 0, double i = 0) {
        real = r;
        imag = i;
    }
    friend complex operator+(complex, complex);
    void show() {
        cout << real << " + " << imag << "i";
    }
};
complex operator+(complex a, complex b) {
    double r = a.real + b.real;
    double i = a.imag + b.imag;
    return complex(r, i);
}

int main() {
    complex x(5,3), y;
    y = x + 7;
    y = 7 + y;
    y.show();
    return 0;
}