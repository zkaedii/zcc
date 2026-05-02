/* zcc-level3: mini-make — simplified make
 * Parses a Makefile with format:
 *   target: dep1 dep2
 *   \tcommand1
 *   \tcommand2
 * Builds first target (or specified target)
 * Rebuilds if target missing or any dep is newer
 */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

int file_exists(char *path) {
    FILE *f;
    f = fopen(path, "r");
    if (f) {
        fclose(f);
        return 1;
    }
    return 0;
}

/* simple rule storage */
char rule_target[64][256];
char rule_deps[64][1024];
char rule_cmds[64][4096];
int nrules;

void trim_newline(char *s) {
    int len;
    len = strlen(s);
    while (len > 0 && (s[len - 1] == '\n' || s[len - 1] == '\r')) {
        s[len - 1] = '\0';
        len = len - 1;
    }
}

int parse_makefile(char *path) {
    FILE *f;
    char line[4096];
    int ch;
    int pos;
    int i;
    int colon;
    int cur;

    f = fopen(path, "r");
    if (!f) {
        fprintf(stderr, "mini-make: cannot open '%s'\n", path);
        return -1;
    }

    nrules = 0;
    cur = -1;

    while (1) {
        pos = 0;
        ch = fgetc(f);
        if (ch == (-1)) break;

        while (ch != (-1) && ch != '\n' && pos < 4094) {
            line[pos] = ch;
            pos = pos + 1;
            ch = fgetc(f);
        }
        line[pos] = '\0';

        /* skip empty lines and comments */
        if (pos == 0) continue;
        if (line[0] == '#') continue;

        /* command line (starts with tab) */
        if (line[0] == '\t' && cur >= 0) {
            if (rule_cmds[cur][0] != '\0') {
                strcat(rule_cmds[cur], "\n");
            }
            strcat(rule_cmds[cur], line + 1);
            continue;
        }

        /* rule line: find colon */
        colon = -1;
        i = 0;
        while (i < pos) {
            if (line[i] == ':') {
                colon = i;
                break;
            }
            i = i + 1;
        }

        if (colon > 0 && nrules < 64) {
            cur = nrules;

            /* extract target */
            i = 0;
            while (i < colon && i < 255) {
                rule_target[cur][i] = line[i];
                i = i + 1;
            }
            /* trim trailing spaces */
            while (i > 0 && rule_target[cur][i - 1] == ' ') {
                i = i - 1;
            }
            rule_target[cur][i] = '\0';

            /* extract deps */
            i = colon + 1;
            while (line[i] == ' ') i = i + 1;
            strncpy(rule_deps[cur], line + i, 1023);
            rule_deps[cur][1023] = '\0';
            trim_newline(rule_deps[cur]);

            rule_cmds[cur][0] = '\0';
            nrules = nrules + 1;
        }
    }

    fclose(f);
    return 0;
}

int find_rule(char *target) {
    int i;
    i = 0;
    while (i < nrules) {
        if (strcmp(rule_target[i], target) == 0)
            return i;
        i = i + 1;
    }
    return -1;
}

int needs_build(int idx) {
    char dep[256];
    int di;
    int si;
    char *deps;

    /* if target doesn't exist, must build */
    if (!file_exists(rule_target[idx]))
        return 1;

    /* check each dep exists */
    deps = rule_deps[idx];
    si = 0;
    while (deps[si] != '\0') {
        /* skip spaces */
        while (deps[si] == ' ') si = si + 1;
        if (deps[si] == '\0') break;

        /* read dep name */
        di = 0;
        while (deps[si] != ' ' && deps[si] != '\0' && di < 255) {
            dep[di] = deps[si];
            di = di + 1;
            si = si + 1;
        }
        dep[di] = '\0';

        if (di > 0 && !file_exists(dep)) {
            /* dep missing, try to build it */
            return 1;
        }
    }

    return 0;
}

int build(char *target, int depth) {
    int idx;
    int rc;
    char dep[256];
    int di;
    int si;
    char *deps;
    char *cmds;
    char cmd[4096];
    int ci;

    if (depth > 16) {
        fprintf(stderr, "mini-make: recursion too deep for '%s'\n", target);
        return 1;
    }

    idx = find_rule(target);
    if (idx < 0) {
        /* no rule; check if file exists */
        if (file_exists(target))
            return 0;
        fprintf(stderr, "mini-make: no rule to make '%s'\n", target);
        return 1;
    }

    /* build deps first */
    deps = rule_deps[idx];
    si = 0;
    while (deps[si] != '\0') {
        while (deps[si] == ' ') si = si + 1;
        if (deps[si] == '\0') break;

        di = 0;
        while (deps[si] != ' ' && deps[si] != '\0' && di < 255) {
            dep[di] = deps[si];
            di = di + 1;
            si = si + 1;
        }
        dep[di] = '\0';

        if (di > 0) {
            rc = build(dep, depth + 1);
            if (rc != 0) return rc;
        }
    }

    /* check if we need to rebuild */
    if (!needs_build(idx))
        return 0;

    /* execute commands */
    cmds = rule_cmds[idx];
    si = 0;
    while (cmds[si] != '\0') {
        ci = 0;
        while (cmds[si] != '\n' && cmds[si] != '\0' && ci < 4094) {
            cmd[ci] = cmds[si];
            ci = ci + 1;
            si = si + 1;
        }
        cmd[ci] = '\0';
        if (cmds[si] == '\n') si = si + 1;

        if (ci > 0) {
            printf("%s\n", cmd);
            rc = system(cmd);
            if (rc != 0) {
                fprintf(stderr, "mini-make: command failed (rc=%d)\n", rc);
                return 1;
            }
        }
    }

    return 0;
}

int main(int argc, char **argv) {
    char *target;
    char *makefile;
    int i;
    int rc;

    makefile = "Makefile";
    target = 0;

    i = 1;
    while (i < argc) {
        if (argv[i][0] == '-' && argv[i][1] == 'f' && i + 1 < argc) {
            i = i + 1;
            makefile = argv[i];
        } else {
            target = argv[i];
        }
        i = i + 1;
    }

    rc = parse_makefile(makefile);
    if (rc < 0) return 1;

    if (nrules == 0) {
        fprintf(stderr, "mini-make: no rules found\n");
        return 1;
    }

    if (!target)
        target = rule_target[0];

    rc = build(target, 0);
    return rc;
}
