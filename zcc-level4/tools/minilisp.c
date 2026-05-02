/* zcc-level4: mini-lisp — S-expression evaluator
 * Types: integers, symbols, cons cells, nil
 * Built-ins: +, -, *, /, mod, =, <, >, if, define, quote, cons,
 *            car, cdr, list, null?, print, begin
 * Uses arena allocator (no malloc needed)
 */
#include <stdio.h>
#include <string.h>

/* node types */
int T_INT;
int T_SYM;
int T_CONS;
int T_NIL;
int T_BUILTIN;

/* arena allocator */
int node_type[4096];
long node_ival[4096];
char node_sval[4096][32];
int node_car[4096];
int node_cdr[4096];
int next_node;

/* environment: parallel arrays */
char env_name[512][32];
int env_val[512];
int env_count;

/* input */
char input[4096];
int input_pos;

void init(void) {
    T_INT = 1;
    T_SYM = 2;
    T_CONS = 3;
    T_NIL = 4;
    T_BUILTIN = 5;
    next_node = 1; /* 0 = NIL */
    node_type[0] = 4; /* T_NIL */
    env_count = 0;
}

int alloc_node(void) {
    int n;
    n = next_node;
    next_node = next_node + 1;
    node_type[n] = 0;
    node_ival[n] = 0;
    node_sval[n][0] = '\0';
    node_car[n] = 0;
    node_cdr[n] = 0;
    return n;
}

int make_int(long val) {
    int n;
    n = alloc_node();
    node_type[n] = 1; /* T_INT */
    node_ival[n] = val;
    return n;
}

int make_sym(char *name) {
    int n;
    n = alloc_node();
    node_type[n] = 2; /* T_SYM */
    strncpy(node_sval[n], name, 31);
    node_sval[n][31] = '\0';
    return n;
}

int make_cons(int car, int cdr) {
    int n;
    n = alloc_node();
    node_type[n] = 3; /* T_CONS */
    node_car[n] = car;
    node_cdr[n] = cdr;
    return n;
}

int is_nil(int n) {
    return n == 0 || node_type[n] == 4;
}

/* environment lookup */
int env_find(char *name) {
    int i;
    i = env_count - 1;
    while (i >= 0) {
        if (strcmp(env_name[i], name) == 0)
            return env_val[i];
        i = i - 1;
    }
    return 0;
}

void env_set(char *name, int val) {
    int i;
    /* check if exists */
    i = env_count - 1;
    while (i >= 0) {
        if (strcmp(env_name[i], name) == 0) {
            env_val[i] = val;
            return;
        }
        i = i - 1;
    }
    /* add new */
    strncpy(env_name[env_count], name, 31);
    env_name[env_count][31] = '\0';
    env_val[env_count] = val;
    env_count = env_count + 1;
}

/* parser */
int peek_char(void) {
    return input[input_pos];
}

int read_char(void) {
    int c;
    c = input[input_pos];
    if (c != '\0')
        input_pos = input_pos + 1;
    return c;
}

void skip_ws(void) {
    while (input[input_pos] == ' ' || input[input_pos] == '\t' ||
           input[input_pos] == '\n' || input[input_pos] == '\r')
        input_pos = input_pos + 1;
}

int is_delim(int c) {
    return c == '(' || c == ')' || c == ' ' || c == '\t' ||
           c == '\n' || c == '\r' || c == '\0';
}

int parse_expr(void);

int parse_list(void) {
    int first;
    int rest;

    skip_ws();
    if (peek_char() == ')') {
        read_char();
        return 0; /* nil */
    }
    if (peek_char() == '\0') return 0;

    first = parse_expr();
    rest = parse_list();
    return make_cons(first, rest);
}

int parse_expr(void) {
    char buf[32];
    int bi;
    int c;
    long val;
    int neg;

    skip_ws();
    c = peek_char();

    if (c == '\0') return 0;

    /* list */
    if (c == '(') {
        read_char();
        return parse_list();
    }

    /* quote shorthand */
    if (c == '\'') {
        read_char();
        return make_cons(make_sym("quote"), make_cons(parse_expr(), 0));
    }

    /* atom: number or symbol */
    bi = 0;
    while (!is_delim(peek_char()) && bi < 31) {
        buf[bi] = read_char();
        bi = bi + 1;
    }
    buf[bi] = '\0';

    /* try number */
    neg = 0;
    val = 0;
    bi = 0;
    if (buf[0] == '-' && buf[1] != '\0') {
        neg = 1;
        bi = 1;
    }
    if (buf[bi] >= '0' && buf[bi] <= '9') {
        while (buf[bi] >= '0' && buf[bi] <= '9') {
            val = val * 10 + (buf[bi] - '0');
            bi = bi + 1;
        }
        if (buf[bi] == '\0') {
            if (neg) val = -val;
            return make_int(val);
        }
    }

    return make_sym(buf);
}

/* printer */
void print_expr(int n) {
    int cur;

    if (is_nil(n)) {
        printf("nil");
        return;
    }

    if (node_type[n] == 1) { /* T_INT */
        printf("%ld", node_ival[n]);
        return;
    }

    if (node_type[n] == 2) { /* T_SYM */
        printf("%s", node_sval[n]);
        return;
    }

    if (node_type[n] == 3) { /* T_CONS */
        printf("(");
        cur = n;
        while (node_type[cur] == 3) {
            print_expr(node_car[cur]);
            if (!is_nil(node_cdr[cur])) printf(" ");
            cur = node_cdr[cur];
        }
        if (!is_nil(cur)) {
            printf(". ");
            print_expr(cur);
        }
        printf(")");
        return;
    }

    printf("?");
}

/* evaluator */
int eval(int n);

int list_len(int n) {
    int count;
    count = 0;
    while (node_type[n] == 3) {
        count = count + 1;
        n = node_cdr[n];
    }
    return count;
}

int nth(int list, int idx) {
    while (idx > 0 && node_type[list] == 3) {
        list = node_cdr[list];
        idx = idx - 1;
    }
    if (node_type[list] == 3) return node_car[list];
    return 0;
}

int eval(int n) {
    char *head;
    long a;
    long b;
    int args;
    int cur;
    int result;
    int cond;
    int i;

    if (is_nil(n)) return 0;

    /* integer evaluates to itself */
    if (node_type[n] == 1) return n;

    /* symbol: environment lookup */
    if (node_type[n] == 2) {
        result = env_find(node_sval[n]);
        if (result != 0) return result;
        return n; /* return symbol itself if unbound */
    }

    /* list: function application */
    if (node_type[n] != 3) return n;

    /* get head */
    if (node_type[node_car[n]] != 2) {
        /* head not a symbol, eval it */
        return n;
    }

    head = node_sval[node_car[n]];
    args = node_cdr[n];

    /* special forms */
    if (strcmp(head, "quote") == 0) {
        return nth(args, 0);
    }

    if (strcmp(head, "if") == 0) {
        cond = eval(nth(args, 0));
        if (!is_nil(cond) && !(node_type[cond] == 1 && node_ival[cond] == 0)) {
            return eval(nth(args, 1));
        } else {
            return eval(nth(args, 2));
        }
    }

    if (strcmp(head, "define") == 0) {
        result = eval(nth(args, 1));
        env_set(node_sval[nth(args, 0)], result);
        return result;
    }

    if (strcmp(head, "begin") == 0) {
        result = 0;
        cur = args;
        while (node_type[cur] == 3) {
            result = eval(node_car[cur]);
            cur = node_cdr[cur];
        }
        return result;
    }

    /* arithmetic: evaluate args first */
    if (strcmp(head, "+") == 0) {
        a = node_ival[eval(nth(args, 0))];
        b = node_ival[eval(nth(args, 1))];
        return make_int(a + b);
    }
    if (strcmp(head, "-") == 0) {
        a = node_ival[eval(nth(args, 0))];
        b = node_ival[eval(nth(args, 1))];
        return make_int(a - b);
    }
    if (strcmp(head, "*") == 0) {
        a = node_ival[eval(nth(args, 0))];
        b = node_ival[eval(nth(args, 1))];
        return make_int(a * b);
    }
    if (strcmp(head, "/") == 0) {
        a = node_ival[eval(nth(args, 0))];
        b = node_ival[eval(nth(args, 1))];
        if (b == 0) return make_int(0);
        return make_int(a / b);
    }
    if (strcmp(head, "mod") == 0) {
        a = node_ival[eval(nth(args, 0))];
        b = node_ival[eval(nth(args, 1))];
        if (b == 0) return make_int(0);
        return make_int(a % b);
    }

    /* comparison */
    if (strcmp(head, "=") == 0) {
        a = node_ival[eval(nth(args, 0))];
        b = node_ival[eval(nth(args, 1))];
        return make_int(a == b ? 1 : 0);
    }
    if (strcmp(head, "<") == 0) {
        a = node_ival[eval(nth(args, 0))];
        b = node_ival[eval(nth(args, 1))];
        return make_int(a < b ? 1 : 0);
    }
    if (strcmp(head, ">") == 0) {
        a = node_ival[eval(nth(args, 0))];
        b = node_ival[eval(nth(args, 1))];
        return make_int(a > b ? 1 : 0);
    }

    /* list ops */
    if (strcmp(head, "cons") == 0) {
        return make_cons(eval(nth(args, 0)), eval(nth(args, 1)));
    }
    if (strcmp(head, "car") == 0) {
        result = eval(nth(args, 0));
        if (node_type[result] == 3) return node_car[result];
        return 0;
    }
    if (strcmp(head, "cdr") == 0) {
        result = eval(nth(args, 0));
        if (node_type[result] == 3) return node_cdr[result];
        return 0;
    }
    if (strcmp(head, "list") == 0) {
        result = 0;
        /* build list in reverse then reverse */
        i = list_len(args) - 1;
        while (i >= 0) {
            result = make_cons(eval(nth(args, i)), result);
            i = i - 1;
        }
        return result;
    }
    if (strcmp(head, "null?") == 0) {
        result = eval(nth(args, 0));
        return make_int(is_nil(result) ? 1 : 0);
    }

    /* print */
    if (strcmp(head, "print") == 0) {
        result = eval(nth(args, 0));
        print_expr(result);
        printf("\n");
        return result;
    }

    /* unknown function — try env lookup */
    return n;
}

int main(void) {
    int ch;
    int pos;
    int expr;

    init();

    while (1) {
        pos = 0;
        ch = getchar();
        if (ch == (-1)) break;

        while (ch != (-1) && ch != '\n' && pos < 4094) {
            input[pos] = ch;
            pos = pos + 1;
            ch = getchar();
        }
        input[pos] = '\0';

        /* skip empty/comment lines */
        if (pos == 0) continue;
        if (input[0] == ';') continue;

        input_pos = 0;
        skip_ws();
        if (peek_char() == '\0') continue;

        expr = parse_expr();
        expr = eval(expr);
        print_expr(expr);
        printf("\n");

        if (ch == (-1)) break;
    }

    return 0;
}
