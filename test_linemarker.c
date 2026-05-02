/* test_linemarker.c -- isolated test for # N "file" linemarker parsing.
 *
 * When the lexer correctly parses the linemarker below, any anomaly or
 * error on the next line should be attributed to line 42 of "fake_source.c".
 *
 * Expected --emit-anomalies output after lexer fix:
 *   site: "test_linemarker.c:lm_test:42"  (source-level)
 *
 * If offset is wrong by 1:
 *   :41 => lm_line-1 is being applied after the newline, not before
 *   :43 => need lm_line-2 (shouldn't happen with the current lexer loop)
 */
void *malloc(unsigned long);

# 42 "fake_source.c"
void lm_test() {
    void *p = malloc(10);
    *(int*)p = 1;
}

int main() {
    lm_test();
    return 0;
}
