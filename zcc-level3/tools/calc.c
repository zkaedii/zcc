/* zcc-level3: calc — expression calculator
 * Tokenizer + recursive descent parser + evaluator
 * Supports: +, -, *, /, %, (, ), unary minus
 * Variables: a-z (single letter), assignment with =
 * Reads one expression per line, prints result
 */
#include <stdio.h>
#include <string.h>

long vars[26];
char line[4096];
int pos;

int peek(void) {
    while (line[pos] == ' ' || line[pos] == '\t')
        pos = pos + 1;
    return line[pos];
}

int next_char(void) {
    int c;
    c = peek();
    if (c != '\0' && c != '\n')
        pos = pos + 1;
    return c;
}

/* forward declarations */
long parse_expr(void);
long parse_term(void);
long parse_factor(void);
long parse_unary(void);
long parse_primary(void);

long parse_primary(void) {
    int c;
    long val;
    int neg;

    c = peek();

    /* parenthesized expression */
    if (c == '(') {
        next_char();
        val = parse_expr();
        if (peek() == ')')
            next_char();
        return val;
    }

    /* number */
    if (c >= '0' && c <= '9') {
        val = 0;
        while (peek() >= '0' && peek() <= '9') {
            val = val * 10 + (next_char() - '0');
        }
        return val;
    }

    /* variable */
    if (c >= 'a' && c <= 'z') {
        next_char();
        return vars[c - 'a'];
    }

    /* fallback */
    return 0;
}

long parse_unary(void) {
    int c;
    c = peek();
    if (c == '-') {
        next_char();
        return -parse_unary();
    }
    if (c == '+') {
        next_char();
        return parse_unary();
    }
    return parse_primary();
}

long parse_factor(void) {
    long left;
    long right;
    int c;

    left = parse_unary();

    while (1) {
        c = peek();
        if (c == '*') {
            next_char();
            right = parse_unary();
            left = left * right;
        } else if (c == '/') {
            next_char();
            right = parse_unary();
            if (right != 0)
                left = left / right;
            else {
                fprintf(stderr, "division by zero\n");
                return 0;
            }
        } else if (c == '%') {
            next_char();
            right = parse_unary();
            if (right != 0)
                left = left % right;
            else {
                fprintf(stderr, "modulo by zero\n");
                return 0;
            }
        } else {
            break;
        }
    }

    return left;
}

long parse_term(void) {
    long left;
    long right;
    int c;

    left = parse_factor();

    while (1) {
        c = peek();
        if (c == '+') {
            next_char();
            right = parse_factor();
            left = left + right;
        } else if (c == '-') {
            next_char();
            right = parse_factor();
            left = left - right;
        } else {
            break;
        }
    }

    return left;
}

long parse_expr(void) {
    int c;
    int var_idx;
    int save_pos;
    long val;

    /* check for assignment: a = expr */
    save_pos = pos;
    c = peek();
    if (c >= 'a' && c <= 'z') {
        var_idx = c - 'a';
        next_char();
        if (peek() == '=') {
            next_char();
            val = parse_expr();
            vars[var_idx] = val;
            return val;
        }
        /* not an assignment, rewind */
        pos = save_pos;
    }

    return parse_term();
}

int main(int argc, char **argv) {
    int ch;
    int i;
    long result;

    /* init variables */
    i = 0;
    while (i < 26) {
        vars[i] = 0;
        i = i + 1;
    }

    /* read lines */
    while (1) {
        pos = 0;
        i = 0;

        ch = getchar();
        if (ch == (-1)) break;

        while (ch != (-1) && ch != '\n' && i < 4094) {
            line[i] = ch;
            i = i + 1;
            ch = getchar();
        }
        line[i] = '\0';

        /* skip empty lines */
        pos = 0;
        if (peek() == '\0') continue;

        result = parse_expr();
        printf("%ld\n", result);

        if (ch == (-1)) break;
    }

    return 0;
}
