#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    const double PI = 3.1415926;
    std::cout << std::setprecision(8) << PI << std::endl;
    cout << setfill('*');
    cout << setw(3) << 1 << endl;
    cout << setw(3) << 2 << endl;
    cout << setfill('$');
    cout << setiosflags(ios_base::left);
    cout << setw(3) << 1 << endl << setw(3) << 2 << endl;
    cout << resetiosflags(ios_base::left);
    cout << setw(3) << 1 << endl << setw(3) << 2 << endl;
    cout << "65" << endl << "66" << endl;
    int *p = new int(55);
    int x = 55;
    int y(55);
    cout << *p << endl;
    cout << x << endl << y << endl;
    return 0;
}