#include <stdlib.h>

void test_shadow() {
    void *p1 = malloc(10);
    *(int*)p1 = 1; // Site A: p1 is unchecked deref
    
    void *p2 = malloc(20);
    *(int*)p2 = 2; // Site B: p2 is unchecked deref
}

int main() {
    test_shadow();
    return 0;
}
