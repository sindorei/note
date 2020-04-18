#include <iostream>
using namespace std;

class Shape {
    public:
        virtual void calcArea() {
            cout << "Shape ..." << endl;
        }
    virtual  void a() = 0;
};

class Rect: public Shape {
public:
    void calcArea() {
        cout << "Rect ..." << endl;
    }
    void a() {
        cout << "Rect a()" << endl;
    }
};

int main() {
    Shape *b = new Rect();

    b -> calcArea();

    return 0;
}