#include <iostream>
#include <vector>
using namespace std;
int main() {
    double a[] = {1.1, 4.4, 3.3, 2.2};
    vector<double> va(a, a + 4), vb(4);
    typedef vector<double>::iterator iterator;
    iterator first = va.begin();
    for( first; first < va.end(); first++) {
        cout << *first << " ";
    }
    cout << endl;
    for(--first; first > va.begin() - 1; first--) {
        cout << *first << " ";
    }

    cout << endl;
    copy(va.begin(), va.end(), ostream_iterator<double>(cout, " "));

    cout << endl;

    typedef vector <double>::reverse_iterator reverse_iterator;
    reverse_iterator last = va.rbegin();
    for(last; last < va.rend(); last++) {
        cout<< *last << " ";
    }
    cout << endl;

    for(--last; last > va.rbegin() - 1; last--)
        cout << *last << " ";
    cout << endl;
    copy(va.rbegin(), va.rend(), ostream_iterator<double>(cout, " "));
    return 0;
}